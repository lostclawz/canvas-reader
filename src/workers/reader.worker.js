import { MESSAGES } from '../constants/constants.js';
import {
  joinLines,
  measureWordSet,
  memo,
  quickStringSearch,
  reduceLines,
  splitLines,
} from '../utils/reader-utils.js';
import { setupScrollBar } from '../utils/scrollbar.js';

const SEARCH_PARAGRAPHS = false;
let ctx;
let width;
let height;
let ratio;
let searchText = '';
let searcher;
let measureFn;
let lineHeight = 1.1;
let fillStyle;
let size = 15;
let rawContent;
let paragraphs = [];
let lines = [];
let linesRaw = [];
let scrollBar;

const updateSearch = (txt) => {
  searchText = txt;

  if (SEARCH_PARAGRAPHS) {
    if (searchText) {
      const { results } = joinLines(
        searcher ? searcher(searchText) : paragraphs
      );
      linesRaw = results;
      lines = reduceLines(measureFn, width - 5, linesRaw);
    } else {
      lines = paragraphs;
    }
  } else if (searchText && searcher) {
    const { results } = searcher(searchText);
    lines = results;
  } else {
    lines = linesRaw;
  }

  if (scrollBar) {
    scrollBar.setTextHeight(size * lineHeight * lines.length);
    scrollBar.setScrollOffset(0);
  }
};

const updateCanvas = () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  let line;
  let idx;
  let yPos;
  const offset = scrollBar.getScrollOffset();
  const firstIdx = Math.floor(-offset / size / lineHeight);
  const lastIdx = Math.ceil(height / (lineHeight * size)) + firstIdx;

  for (idx = firstIdx; idx <= lastIdx; idx++) {
    line = lines[idx];
    if (line === undefined) break;
    yPos = idx * lineHeight * size + offset;
    if (yPos >= -(lineHeight * size) && yPos < height) {
      ctx.fillText(line, 0, yPos);
    }
    if (yPos > height) {
      break;
    }
  }

  scrollBar.draw();
};

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

const rebuildContent = () => {
  if (SEARCH_PARAGRAPHS) {
    paragraphs = splitLines(rawContent);
    searcher = memo(quickStringSearch(paragraphs));
  } else {
    linesRaw = reduceLines(measureFn, width - 5, rawContent);
    searcher = memo(quickStringSearch(linesRaw));
  }
};

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
