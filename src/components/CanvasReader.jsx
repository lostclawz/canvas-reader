/**
 * @fileoverview Main canvas-based text reader component.
 * Renders text content on an HTML5 canvas using an offscreen canvas and Web Worker
 * for high-performance rendering with support for custom fonts, searching, and scrolling.
 */

import React, { useEffect, useRef } from 'react';
import { MESSAGES } from '../constants/constants';
import useReaderAutoScroll from '../hooks/useReaderAutoScroll';
import { stopMouseEvents } from '../utils/reader-utils';
import { computeRatio, firstTrue, relativeMousePos, useResizeObserver } from '../utils/utils';

const DEFAULT_FONTSTYLE = 'normal';
const getFontStyle = firstTrue(DEFAULT_FONTSTYLE);

/**
 * Extracts mouse event properties needed for worker communication.
 * Filters out DOM-specific properties that cannot be transferred to a Web Worker.
 *
 * @param {MouseEvent} e - Mouse event object
 * @returns {Object} Serializable mouse event properties
 * @private
 */
const pickMouseProps = (e) => ({
  altKey: e.altKey,
  button: e.button,
  buttons: e.buttons,
  clientX: e.clientX,
  clientY: e.clientY,
  ctrlKey: e.ctrlKey,
  metaKey: e.metaKey,
  pageX: e.pageX,
  pageY: e.pageY,
  screenX: e.screenX,
  screenY: e.screenY,
  shiftKey: e.shiftKey,
  movementY: e.movementY,
});

/**
 * CanvasReader component props.
 * @typedef {Object} CanvasReaderProps
 * @property {string} [fontFamily='Merriweather'] - CSS font family name
 * @property {number} [size=10] - Font size in pixels
 * @property {number} [lineHeight=1.25] - Line height multiplier (1.0 = no spacing, 1.5 = 50% spacing)
 * @property {string} [fillStyle='black'] - Text fill color (CSS color value)
 * @property {string} [strokeStyle='black'] - Text stroke color (CSS color value)
 * @property {string} [weight='normal'] - Font weight (normal, bold, 100-900)
 * @property {boolean} [italic=false] - Use italic font style
 * @property {boolean} [oblique=false] - Use oblique font style
 * @property {string} [variant='normal'] - Font variant (normal, small-caps)
 * @property {string} [align='left'] - Text alignment (left, center, right)
 * @property {string} [baseline='top'] - Text baseline (top, middle, bottom, alphabetic)
 * @property {string} [route='/books'] - URL route to fetch book content from
 * @property {number} [canvasWidth=1200] - Canvas width in pixels
 * @property {number} [canvasHeight=800] - Canvas height in pixels
 * @property {string} [searchText=''] - Text to search for and highlight in the document
 * @property {boolean} [autoScroll=false] - Enable automatic scrolling
 * @property {number} [autoScrollTime=60] - Auto-scroll interval in milliseconds
 * @property {number} [autoScrollAmt=2] - Auto-scroll amount in pixels per interval
 */

/**
 * High-performance canvas-based text reader component.
 * Renders text content using an offscreen canvas and Web Worker to keep the UI thread responsive.
 * Supports custom fonts, text search, scrolling (manual and automatic), and high-DPI displays.
 *
 * The component uses transferControlToOffscreen() to render on a Web Worker, preventing
 * UI blocking during text layout and rendering operations.
 *
 * @param {CanvasReaderProps} props - Component configuration props
 * @returns {React.ReactElement} Canvas element with text rendering
 *
 * @example
 * // Basic usage
 * <CanvasReader
 *   route="/books/mybook.txt"
 *   canvasWidth={800}
 *   canvasHeight={600}
 *   size={16}
 * />
 *
 * @example
 * // With custom styling and auto-scroll
 * <CanvasReader
 *   route="/books/mybook.txt"
 *   fontFamily="Georgia"
 *   size={18}
 *   lineHeight={1.5}
 *   fillStyle="#333"
 *   weight="300"
 *   autoScroll={true}
 *   autoScrollTime={100}
 *   autoScrollAmt={3}
 * />
 *
 * @example
 * // With search functionality
 * <CanvasReader
 *   route="/books/mybook.txt"
 *   searchText="chapter"
 *   size={14}
 * />
 */
export const CanvasReader = ({
  fontFamily = 'Merriweather',
  size = 10,
  lineHeight = 1.25,
  fillStyle = 'black',
  strokeStyle = 'black',
  weight = 'normal',
  italic = false,
  oblique = false,
  variant = 'normal',
  align = 'left',
  baseline = 'top',
  route = '/books',
  canvasWidth = 1200,
  canvasHeight = 800,
  searchText = '',
  autoScroll = false,
  autoScrollTime = 60,
  autoScrollAmt = 2,
}) => {
  const offscreenCanvas = useRef(null);
  const [canvasRef] = useResizeObserver();

  const workerRef = useRef(null);
  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/reader.worker.js', import.meta.url), {
      type: 'module',
    });
    return () => {
      if (workerRef.current && typeof workerRef.current.terminate === 'function') {
        workerRef.current.postMessage({ type: 'kill' });
        workerRef.current.terminate();
      }
    };
  }, []);

  const fontStyle = getFontStyle([
    [italic, 'italic'],
    [oblique, 'oblique'],
  ]);

  const font = [fontStyle, variant, weight, `${size}px`, fontFamily].join(' ');

  useEffect(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({
      type: MESSAGES.SEARCH,
      searchText,
    });
  }, [searchText]);

  const fontProps = {
    font,
    baseline,
    align,
    size,
    lineHeight,
    fillStyle,
    strokeStyle,
  };
  useEffect(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({
      type: MESSAGES.UPDATE,
      font,
      baseline,
      align,
      size,
      lineHeight,
      fillStyle,
      strokeStyle,
    });
  }, [font, baseline, align, size, lineHeight, fillStyle, strokeStyle]);

  if (route && canvasRef.current && !offscreenCanvas.current) {
    const ratio = computeRatio(canvasRef.current);
    canvasRef.current.width = canvasWidth * ratio;
    canvasRef.current.height = canvasHeight * ratio;
    canvasRef.current.style.width = `${canvasWidth}px`;
    canvasRef.current.style.height = `${canvasHeight}px`;

    offscreenCanvas.current = canvasRef.current.transferControlToOffscreen();

    workerRef.current.postMessage(
      {
        type: MESSAGES.INIT,
        route,
        canvas: offscreenCanvas.current,
        width: canvasWidth,
        height: canvasHeight,
        ratio,
        ...fontProps,
      },
      [offscreenCanvas.current]
    );
  }

  useReaderAutoScroll(workerRef.current, {
    enabled: autoScroll,
    time: autoScrollTime,
    amount: autoScrollAmt,
  });

  const mouseMessage = (type) => (e) => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({
      type,
      ...relativeMousePos(e),
      ...pickMouseProps(e),
    });
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      onMouseDown={mouseMessage(MESSAGES.MOUSE_DOWN)}
      onMouseUp={mouseMessage(MESSAGES.MOUSE_UP)}
      onMouseMove={mouseMessage(MESSAGES.MOUSE_MOVE)}
      onContextMenu={stopMouseEvents}
      onWheel={(e) => {
        if (!workerRef.current) return;
        workerRef.current.postMessage({
          type: MESSAGES.SCROLL,
          scrollDelta: e.deltaY,
        });
      }}
    />
  );
};

CanvasReader.displayName = 'CanvasReader';
export default CanvasReader;
