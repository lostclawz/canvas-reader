import { useEffect, useRef } from 'react';
import { MESSAGES } from '../constants/constants';
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
