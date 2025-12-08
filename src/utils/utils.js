/**
 * @fileoverview General utility functions for the canvas reader application.
 * Includes helpers for conditional logic, canvas scaling, mouse positioning, and resize observation.
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Returns the value associated with the first truthy condition in an array of condition-value pairs.
 * This is a curried function that first takes a default value, then accepts an array of pairs.
 *
 * @param {*} defaultValue - The value to return if no condition is truthy
 * @returns {Function} A function that takes pairs and returns the first matching value
 *
 * @example
 * const getValue = firstTrue('default');
 * getValue([[false, 'a'], [true, 'b'], [true, 'c']]); // returns 'b'
 * getValue([[false, 'a'], [false, 'b']]); // returns 'default'
 */
export const firstTrue = (defaultValue) => (pairs) => {
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0]) return pairs[i][1];
  }
  return defaultValue;
};

/**
 * Computes the device pixel ratio for high-DPI displays.
 * Used to properly scale canvas elements on retina and high-resolution displays.
 *
 * @param {HTMLCanvasElement} [_canvas] - Unused parameter (kept for backwards compatibility)
 * @returns {number} The device pixel ratio (typically 1, 2, or 3)
 *
 * @example
 * const ratio = computeRatio(); // returns 2 on retina displays, 1 on standard displays
 */
export const computeRatio = (_canvas) => {
  const dpr = window.devicePixelRatio || 1;
  const backingStore = 1;
  return dpr / backingStore;
};

/**
 * Calculates the mouse position relative to the target element's bounding box.
 * Useful for determining click positions within a canvas or other element.
 *
 * @param {MouseEvent} e - The mouse event object
 * @returns {{x: number, y: number}} The relative mouse coordinates
 *
 * @example
 * element.addEventListener('click', (e) => {
 *   const pos = relativeMousePos(e);
 *   console.log(`Clicked at ${pos.x}, ${pos.y}`);
 * });
 */
export const relativeMousePos = (e) => {
  const rect = e.target.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
};

/**
 * React hook that observes an element's size changes using the ResizeObserver API.
 * Returns a ref to attach to the element and its current width and height.
 *
 * @returns {Array} An array containing [ref, width, height]:
 *   ref (React.RefObject) - React ref to attach to the element to observe,
 *   width (number) - Current width of the element in pixels,
 *   height (number) - Current height of the element in pixels
 *
 * @example
 * function MyComponent() {
 *   const [ref, width, height] = useResizeObserver();
 *   return (
 *     <div ref={ref}>
 *       Size: {width} x {height}
 *     </div>
 *   );
 * }
 */
export const useResizeObserver = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, size.width, size.height];
};
