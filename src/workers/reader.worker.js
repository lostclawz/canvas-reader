/**
 * @fileoverview Web Worker for canvas-based text rendering.
 * Handles all text processing, layout, search, and rendering operations off the main thread
 * to maintain UI responsiveness. Uses offscreen canvas for drawing.
 */

import { MESSAGES } from '../constants/constants.js';
import {
  joinLines,
  measureWordSet,
  memo,
  quickStringSearch,
  quickStringSearchWithNumbers,
  reduceLines,
  reduceLinesWithNumbers,
  splitLines,
} from '../utils/reader-utils.js';
import { setupScrollBar } from '../utils/scrollbar.js';

/** @constant {boolean} Whether to search by paragraphs (true) or by wrapped lines (false) */
const SEARCH_PARAGRAPHS = false;

/** Canvas 2D rendering context @type {CanvasRenderingContext2D|null} */
let ctx;
/** Canvas width in pixels @type {number} */
let width;
/** Canvas height in pixels @type {number} */
let height;
/** Device pixel ratio for high-DPI displays @type {number} */
let ratio;
/** Current search query text @type {string} */
let searchText = '';
/** Memoized search function @type {Function|null} */
let searcher;
/** Function to measure text width @type {Function|null} */
let measureFn;
/** Line height multiplier @type {number} */
let lineHeight = 1.1;
/** Text fill color @type {string} */
let fillStyle;
/** Font size in pixels @type {number} */
let size = 15;
/** Raw text content from the book file @type {string} */
let rawContent;
/** Content split into paragraphs @type {string[]} */
let paragraphs = [];
/** Current lines to display (filtered by search if active) @type {Array<{text: string, lineNum: number}>} */
let lines = [];
/** All lines wrapped to canvas width @type {Array<{text: string, lineNum: number}>} */
let linesRaw = [];
/** Scrollbar instance @type {Object|null} */
let scrollBar;
/** Width reserved for line numbers on the right side @type {number} */
const LINE_NUMBER_WIDTH = 60;
/** Margin between text and line numbers @type {number} */
const LINE_NUMBER_MARGIN = 10;

/**
 * Updates the search filter and rebuilds the visible lines array.
 * If searching by paragraphs, re-wraps matched paragraphs to lines.
 * If searching by lines, filters the wrapped lines directly while preserving line numbers.
 *
 * @param {string} txt - Search query text (empty string shows all content)
 */
const updateSearch = (txt) => {
  searchText = txt;

  if (SEARCH_PARAGRAPHS) {
    if (searchText) {
      const { results } = joinLines(searcher ? searcher(searchText) : paragraphs);
      linesRaw = results;
      lines = reduceLines(measureFn, width - LINE_NUMBER_WIDTH - LINE_NUMBER_MARGIN - 5, linesRaw);
    } else {
      lines = paragraphs;
    }
  } else if (searchText && searcher) {
    // Get filtered results with line numbers preserved
    const { results } = searcher(searchText);
    lines = results;
  } else {
    // Show all lines with their numbers
    lines = linesRaw;
  }

  if (scrollBar) {
    scrollBar.setTextHeight(size * lineHeight * lines.length);
    scrollBar.setScrollOffset(0);
  }
};

/**
 * Renders the visible portion of text to the canvas with line numbers on the right.
 * Uses virtual scrolling to only render lines that are currently visible on screen.
 * Calculates which lines to render based on scroll offset, then draws scrollbar.
 * Line numbers are displayed right-aligned on the right side of the canvas.
 *
 * @returns {void}
 */
const updateCanvas = () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  let lineObj;
  let idx;
  let yPos;
  const offset = scrollBar.getScrollOffset();
  const firstIdx = Math.floor(-offset / size / lineHeight);
  const lastIdx = Math.ceil(height / (lineHeight * size)) + firstIdx;

  // Calculate the X position for line numbers (left of scrollbar)
  const lineNumberX = width - LINE_NUMBER_MARGIN - 5;
  const textMaxWidth = width - LINE_NUMBER_WIDTH - LINE_NUMBER_MARGIN - 5;

  for (idx = firstIdx; idx <= lastIdx; idx++) {
    lineObj = lines[idx];
    if (lineObj === undefined) break;
    yPos = idx * lineHeight * size + offset;

    if (yPos >= -(lineHeight * size) && yPos < height) {
      // Draw the main text on the left
      const lineText = typeof lineObj === 'string' ? lineObj : lineObj.text;
      ctx.fillText(lineText, 0, yPos, textMaxWidth);

      // Draw the line number on the right (if line has number property)
      if (lineObj.lineNum !== undefined) {
        ctx.save();
        ctx.textAlign = 'right';
        ctx.fillStyle = '#888'; // Slightly gray color for line numbers
        ctx.fillText(lineObj.lineNum.toString(), lineNumberX, yPos);
        ctx.restore();
      }
    }

    if (yPos > height) {
      break;
    }
  }

  scrollBar.draw();
};

/**
 * Updates font-related rendering properties on the canvas context.
 * Applies font style, size, alignment, colors, and line height from the provided configuration.
 *
 * @param {Object} changed - Font property configuration object
 * @param {string} changed.font - Complete CSS font string (style variant weight size family)
 * @param {string} changed.baseline - Text baseline (top, middle, bottom, alphabetic)
 * @param {string} changed.align - Text alignment (left, center, right)
 * @param {string} changed.fillStyle - Fill color for text
 * @param {string} changed.strokeStyle - Stroke color for text
 * @param {number} changed.lineHeight - Line height multiplier
 * @param {number} changed.size - Font size in pixels
 */
const updateFontProps = (changed) => {
  const { font, baseline, align, strokeStyle } = changed;
  lineHeight = changed.lineHeight;
  size = changed.size;
  fillStyle = changed.fillStyle;
  if (!ctx) return;
  ctx.font = font;
  ctx.textBaseline = baseline;
  ctx.textAlign = align;
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
};

/**
 * Displays a centered message on the canvas.
 * Used for loading indicators and status messages.
 * Saves and restores canvas state to avoid affecting other rendering.
 *
 * @param {string} message - Text message to display
 * @returns {void}
 */
const textCenter = (message) => {
  if (!ctx) return;
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.font = '15px Helvetica';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'black';
  ctx.fillText(message, width / 2, height / 2);
  ctx.restore();
};

/**
 * Processes raw content and rebuilds the searchable data structures.
 * Depending on SEARCH_PARAGRAPHS setting, either:
 * - Splits into paragraphs and creates paragraph searcher, OR
 * - Wraps text to lines with line numbers and creates line searcher
 * Creates a memoized search function for performance.
 *
 * @returns {void}
 */
const rebuildContent = () => {
  if (SEARCH_PARAGRAPHS) {
    paragraphs = splitLines(rawContent);
    searcher = memo(quickStringSearch(paragraphs));
  } else {
    // Use reduceLinesWithNumbers to get line objects with numbers
    linesRaw = reduceLinesWithNumbers(measureFn, width - LINE_NUMBER_WIDTH - LINE_NUMBER_MARGIN - 5, rawContent);
    searcher = memo(quickStringSearchWithNumbers(linesRaw));
  }
};

/**
 * Web Worker message handler.
 * Processes messages from the main thread to control canvas rendering, scrolling,
 * search, and user interactions. Supported message types:
 * - INIT: Initialize worker with canvas and configuration
 * - KILL: Terminate worker (cleanup)
 * - SCROLL: Apply scroll delta
 * - UPDATE: Update font properties and re-render
 * - SEARCH: Update search query and filter content
 * - MOUSE_DOWN/MOUSE_UP/MOUSE_MOVE: Forward mouse events to scrollbar
 *
 * @param {MessageEvent} evt - Message event from main thread
 * @param {Object} evt.data - Message data object
 * @param {string} evt.data.type - Message type (from MESSAGES constant)
 */
self.onmessage = (evt) => {
  switch (evt.data.type) {
    case MESSAGES.INIT: {
      const { route, canvas } = evt.data;
      width = evt.data.width;
      height = evt.data.height;
      ctx = canvas.getContext('2d');
      measureFn = measureWordSet(ctx);
      scrollBar = setupScrollBar({
        ctx,
        canvasWidth: width,
        canvasHeight: height,
        updateCanvas,
      });
      updateFontProps(evt.data);
      ratio = evt.data.ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      textCenter(`Loading ${route}`);
      fetch(route)
        .then((res) => res.text())
        .then((content) => {
          console.log(content);
          textCenter(`Content Loaded (${content.length}), parsing...`);
          rawContent = content;
          requestAnimationFrame(() => {
            rebuildContent();
            updateSearch('');
            scrollBar.setScrollOffset(0);
          });
        })
        .catch((err) => {
          console.log(err);
        });
      break;
    }
    case MESSAGES.KILL: {
      break;
    }
    case MESSAGES.SCROLL: {
      const { scrollDelta } = evt.data;
      scrollBar.applyScrollDelta(scrollDelta);
      break;
    }
    case MESSAGES.UPDATE: {
      updateFontProps(evt.data);
      updateCanvas();
      break;
    }
    case MESSAGES.SEARCH: {
      updateSearch(evt.data.searchText);
      updateCanvas();
      break;
    }
    case MESSAGES.MOUSE_DOWN:
      scrollBar.handleMouseDown(evt.data);
      break;
    case MESSAGES.MOUSE_UP:
      scrollBar.handleMouseUp(evt.data);
      break;
    case MESSAGES.MOUSE_MOVE:
      if (scrollBar) {
        scrollBar.handleMouseMove(evt.data);
      }
      break;
    default:
      console.log('?', evt);
  }
};
