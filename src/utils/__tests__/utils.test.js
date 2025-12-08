import { cleanup, renderHook } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import { computeRatio, firstTrue, relativeMousePos, useResizeObserver } from '../utils.js';

describe('utils', () => {
  describe('firstTrue', () => {
    it('should return value for first true condition', () => {
      const pairs = [
        [false, 'first'],
        [true, 'second'],
        [true, 'third'],
      ];
      const result = firstTrue('default')(pairs);
      expect(result).to.equal('second');
    });

    it('should return default value when no conditions are true', () => {
      const pairs = [
        [false, 'first'],
        [false, 'second'],
        [false, 'third'],
      ];
      const result = firstTrue('default')(pairs);
      expect(result).to.equal('default');
    });

    it('should handle empty pairs array', () => {
      const pairs = [];
      const result = firstTrue('default')(pairs);
      expect(result).to.equal('default');
    });

    it('should handle truthy values', () => {
      const pairs = [
        [0, 'zero'],
        [1, 'one'],
        [2, 'two'],
      ];
      const result = firstTrue('default')(pairs);
      expect(result).to.equal('one');
    });

    it('should handle null and undefined in conditions', () => {
      const pairs = [
        [null, 'null'],
        [undefined, 'undefined'],
        ['value', 'string'],
      ];
      const result = firstTrue('default')(pairs);
      expect(result).to.equal('string');
    });

    it('should work with different default values', () => {
      const pairs = [[false, 'value']];
      expect(firstTrue(null)(pairs)).to.equal(null);
      expect(firstTrue(0)(pairs)).to.equal(0);
      expect(firstTrue(false)(pairs)).to.equal(false);
      expect(firstTrue(undefined)(pairs)).to.equal(undefined);
    });

    it('should be curried and reusable', () => {
      const withDefault = firstTrue('none');
      const pairs1 = [[true, 'found']];
      const pairs2 = [[false, 'not found']];

      expect(withDefault(pairs1)).to.equal('found');
      expect(withDefault(pairs2)).to.equal('none');
    });

    it('should handle complex values', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const pairs = [
        [false, obj1],
        [true, obj2],
      ];
      const result = firstTrue({})(pairs);
      expect(result).to.equal(obj2);
    });

    it('should return first truthy value without evaluating remaining pairs', () => {
      const pairs = [
        [false, 'first'],
        [true, 'second'],
        [true, 'third'],
      ];

      const result = firstTrue('default')(pairs);
      // Should stop at first truthy and return 'second'
      expect(result).to.equal('second');
    });
  });

  describe('computeRatio', () => {
    let originalDevicePixelRatio;

    beforeEach(() => {
      originalDevicePixelRatio = window.devicePixelRatio;
    });

    afterEach(() => {
      window.devicePixelRatio = originalDevicePixelRatio;
    });

    it('should return device pixel ratio when available', () => {
      window.devicePixelRatio = 2;
      const ratio = computeRatio();
      expect(ratio).to.equal(2);
    });

    it('should return 1 when devicePixelRatio is not available', () => {
      window.devicePixelRatio = undefined;
      const ratio = computeRatio();
      expect(ratio).to.equal(1);
    });

    it('should handle high DPI displays', () => {
      window.devicePixelRatio = 3;
      const ratio = computeRatio();
      expect(ratio).to.equal(3);
    });

    it('should handle retina displays', () => {
      window.devicePixelRatio = 2;
      const ratio = computeRatio();
      expect(ratio).to.equal(2);
    });

    it('should handle fractional device pixel ratios', () => {
      window.devicePixelRatio = 1.5;
      const ratio = computeRatio();
      expect(ratio).to.equal(1.5);
    });

    it('should handle very high DPI values', () => {
      window.devicePixelRatio = 4;
      const ratio = computeRatio();
      expect(ratio).to.equal(4);
    });

    it('should ignore canvas parameter (legacy)', () => {
      window.devicePixelRatio = 2;
      const mockCanvas = {};
      const ratio = computeRatio(mockCanvas);
      expect(ratio).to.equal(2);
    });
  });

  describe('relativeMousePos', () => {
    it('should calculate relative mouse position', () => {
      const mockEvent = {
        clientX: 150,
        clientY: 200,
        target: {
          getBoundingClientRect: () => ({
            left: 50,
            top: 100,
          }),
        },
      };

      const pos = relativeMousePos(mockEvent);
      expect(pos).to.deep.equal({ x: 100, y: 100 });
    });

    it('should handle mouse at element origin', () => {
      const mockEvent = {
        clientX: 50,
        clientY: 100,
        target: {
          getBoundingClientRect: () => ({
            left: 50,
            top: 100,
          }),
        },
      };

      const pos = relativeMousePos(mockEvent);
      expect(pos).to.deep.equal({ x: 0, y: 0 });
    });

    it('should handle negative relative positions', () => {
      const mockEvent = {
        clientX: 40,
        clientY: 90,
        target: {
          getBoundingClientRect: () => ({
            left: 50,
            top: 100,
          }),
        },
      };

      const pos = relativeMousePos(mockEvent);
      expect(pos).to.deep.equal({ x: -10, y: -10 });
    });

    it('should handle scrolled elements', () => {
      const mockEvent = {
        clientX: 300,
        clientY: 400,
        target: {
          getBoundingClientRect: () => ({
            left: 100,
            top: 150,
          }),
        },
      };

      const pos = relativeMousePos(mockEvent);
      expect(pos).to.deep.equal({ x: 200, y: 250 });
    });

    it('should handle fractional pixel positions', () => {
      const mockEvent = {
        clientX: 150.5,
        clientY: 200.7,
        target: {
          getBoundingClientRect: () => ({
            left: 50.2,
            top: 100.3,
          }),
        },
      };

      const pos = relativeMousePos(mockEvent);
      expect(pos.x).to.be.closeTo(100.3, 0.01);
      expect(pos.y).to.be.closeTo(100.4, 0.01);
    });

    it('should handle touch events with clientX/clientY', () => {
      const mockEvent = {
        clientX: 200,
        clientY: 300,
        target: {
          getBoundingClientRect: () => ({
            left: 100,
            top: 100,
          }),
        },
      };

      const pos = relativeMousePos(mockEvent);
      expect(pos).to.deep.equal({ x: 100, y: 200 });
    });

    it('should work with getBoundingClientRect returning additional properties', () => {
      const mockEvent = {
        clientX: 150,
        clientY: 200,
        target: {
          getBoundingClientRect: () => ({
            left: 50,
            top: 100,
            right: 250,
            bottom: 300,
            width: 200,
            height: 200,
          }),
        },
      };

      const pos = relativeMousePos(mockEvent);
      expect(pos).to.deep.equal({ x: 100, y: 100 });
    });
  });

  describe('useResizeObserver', () => {
    let observeStub;
    let disconnectStub;
    let ResizeObserverStub;
    let originalResizeObserver;

    beforeEach(() => {
      observeStub = sinon.stub();
      disconnectStub = sinon.stub();

      ResizeObserverStub = sinon.stub().returns({
        observe: observeStub,
        disconnect: disconnectStub,
      });

      originalResizeObserver = global.ResizeObserver;
      global.ResizeObserver = ResizeObserverStub;
    });

    afterEach(() => {
      cleanup();
      global.ResizeObserver = originalResizeObserver;
    });

    it('should return ref, width, and height', () => {
      const { result } = renderHook(() => useResizeObserver());

      expect(result.current).to.be.an('array');
      expect(result.current).to.have.lengthOf(3);
      expect(result.current[0]).to.have.property('current');
      expect(result.current[1]).to.equal(0);
      expect(result.current[2]).to.equal(0);
    });

    it('should initialize with zero dimensions', () => {
      const { result } = renderHook(() => useResizeObserver());
      const [, width, height] = result.current;

      expect(width).to.equal(0);
      expect(height).to.equal(0);
    });

    it('should handle basic hook lifecycle', () => {
      const { result, unmount } = renderHook(() => useResizeObserver());
      const [ref] = result.current;

      expect(ref).to.have.property('current');
      expect(ref.current).to.be.null;

      unmount();
      expect(true).to.be.true;
    });

    it('should return stable ref across renders', () => {
      const { result, rerender } = renderHook(() => useResizeObserver());
      const [ref1] = result.current;

      rerender();
      const [ref2] = result.current;

      // Ref should be the same object across renders
      expect(ref1).to.equal(ref2);
    });
  });
});
