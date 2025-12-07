export const firstTrue = (defaultValue) => (pairs) => {
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0]) return pairs[i][1];
  }
  return defaultValue;
};

export const computeRatio = (_canvas) => {
  const dpr = window.devicePixelRatio || 1;
  const backingStore = 1;
  return dpr / backingStore;
};

export const relativeMousePos = (e) => {
  const rect = e.target.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
};

import { useEffect, useRef, useState } from 'react';
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
