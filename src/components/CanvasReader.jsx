import React, { useEffect, useRef } from 'react';
import { MESSAGES } from '../constants/constants';
import { stopMouseEvents } from '../utils/reader-utils';
import useReaderAutoScroll from '../hooks/useReaderAutoScroll';
import {
  computeRatio,
  firstTrue,
  relativeMousePos,
  useResizeObserver,
} from '../utils/utils';

const DEFAULT_FONTSTYLE = 'normal';
const getFontStyle = firstTrue(DEFAULT_FONTSTYLE);
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
    workerRef.current = new Worker(
      new URL('../workers/reader.worker.js', import.meta.url),
      { type: 'module' }
    );
    return () => {
      if (
        workerRef.current &&
        typeof workerRef.current.terminate === 'function'
      ) {
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
      ...fontProps,
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
