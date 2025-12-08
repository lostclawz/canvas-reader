/**
 * @fileoverview React hook for automatic scrolling functionality in the canvas reader.
 * Provides configurable auto-scroll with adjustable speed and amount.
 */

import { useEffect, useRef } from 'react';
import { MESSAGES } from '../constants/constants';

/**
 * Auto-scroll configuration options.
 * @typedef {Object} AutoScrollConfig
 * @property {boolean} [enabled=true] - Whether auto-scrolling is enabled
 * @property {number} [time=60] - Interval between scroll steps in milliseconds
 * @property {number} [amount=2] - Number of pixels to scroll per interval
 */

/**
 * Custom React hook that implements automatic scrolling for the canvas reader.
 * Sends periodic scroll messages to the canvas worker at configured intervals.
 * Automatically cleans up the interval when the component unmounts or when dependencies change.
 *
 * @param {Worker} canvasWorker - Web Worker instance for the canvas reader
 * @param {AutoScrollConfig} [config] - Auto-scroll configuration options
 * @param {boolean} [config.enabled=true] - Whether auto-scrolling is enabled
 * @param {number} [config.time=60] - Interval between scroll steps in milliseconds (lower = faster)
 * @param {number} [config.amount=2] - Number of pixels to scroll per interval (higher = faster)
 * @returns {null} This hook has no return value (side-effects only)
 *
 * @example
 * // Basic usage with defaults (enabled, 60ms interval, 2px per step)
 * useReaderAutoScroll(worker);
 *
 * @example
 * // Custom configuration for faster scrolling
 * useReaderAutoScroll(worker, {
 *   enabled: true,
 *   time: 30,    // Faster interval
 *   amount: 5    // Larger scroll amount
 * });
 *
 * @example
 * // Controlled by state
 * const [autoScroll, setAutoScroll] = useState(false);
 * useReaderAutoScroll(worker, {
 *   enabled: autoScroll,
 *   time: 100,
 *   amount: 3
 * });
 */
export default function useReaderAutoScroll(
  canvasWorker,
  { enabled, time, amount } = {
    enabled: true,
    time: 60,
    amount: 2,
  }
) {
  const scrollInterval = useRef(null);
  useEffect(() => {
    if (canvasWorker && enabled) {
      if (scrollInterval.current) {
        clearTimeout(scrollInterval.current);
      }
      scrollInterval.current = setInterval(() => {
        if (!canvasWorker) {
          return;
        }
        canvasWorker.postMessage({
          type: MESSAGES.SCROLL,
          scrollDelta: amount,
        });
      }, time);
    }
    return () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    };
  }, [canvasWorker, enabled, time, amount]);
  return null;
}
