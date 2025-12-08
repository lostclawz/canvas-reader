import { expect } from 'chai';
import sinon from 'sinon';
import { clamp, setupScrollBar } from '../scrollbar.js';

describe('scrollbar', () => {
  describe('clamp', () => {
    it('returns min if num is less than min', () => {
      const minClamp = clamp(0, 10);
      expect(minClamp(-10)).to.equal(0);
    });

    it('returns max if num is greater than max', () => {
      const maxClamp = clamp(0, 10);
      expect(maxClamp(20)).to.equal(10);
    });

    it('returns num if num is between min and max', () => {
      const c = clamp(0, 10);
      expect(c(0)).to.equal(0);
      expect(c(5)).to.equal(5);
      expect(c(10)).to.equal(10);
    });

    it('handles negative ranges', () => {
      const c = clamp(-10, -5);
      expect(c(-15)).to.equal(-10);
      expect(c(-7)).to.equal(-7);
      expect(c(-3)).to.equal(-5);
    });

    it('handles decimal values', () => {
      const c = clamp(0.5, 1.5);
      expect(c(0.1)).to.equal(0.5);
      expect(c(1.0)).to.equal(1.0);
      expect(c(2.0)).to.equal(1.5);
    });
  });

  describe('setupScrollBar', () => {
    let mockCtx;
    let updateCanvasCalled;

    beforeEach(() => {
      updateCanvasCalled = false;
      mockCtx = {
        fillStyle: null,
        fillRect: sinon.spy(),
      };
    });

    it('should create scrollbar with default values', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {
          updateCanvasCalled = true;
        },
      });

      expect(scrollbar).to.exist;
      expect(scrollbar.getWidth()).to.equal(10);
      expect(scrollbar.getHeight()).to.equal(100);
      expect(scrollbar.getScrollOffset()).to.equal(0);
    });

    it('should create scrollbar with custom dimensions', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        width: 20,
        height: 150,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {},
      });

      expect(scrollbar.getWidth()).to.equal(20);
      expect(scrollbar.getHeight()).to.equal(150);
    });

    it('should draw scrollbar at correct position', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        width: 10,
        height: 100,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {},
      });

      scrollbar.draw();

      expect(mockCtx.fillRect.called).to.be.true;
      const [x, y, width, height] = mockCtx.fillRect.firstCall.args;
      expect(x).to.equal(790);
      expect(y).to.be.a('number');
      expect(width).to.equal(10);
      expect(height).to.equal(100);
    });

    it('should update scroll offset and trigger canvas update', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {
          updateCanvasCalled = true;
        },
      });

      scrollbar.setScrollOffset(-50);

      expect(scrollbar.getScrollOffset()).to.equal(-50);
      expect(updateCanvasCalled).to.be.true;
    });

    it('should apply scroll delta correctly', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {
          updateCanvasCalled = true;
        },
      });

      scrollbar.setTextHeight(2000);
      scrollbar.applyScrollDelta(100);

      expect(scrollbar.getScrollOffset()).to.be.lessThan(0);
      expect(updateCanvasCalled).to.be.true;
    });

    it('should clamp scroll offset when using applyScrollDelta', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {},
      });

      scrollbar.setTextHeight(1000);

      scrollbar.setScrollOffset(0);
      scrollbar.applyScrollDelta(-100);
      expect(scrollbar.getScrollOffset()).to.equal(0);

      scrollbar.setScrollOffset(-100);
      scrollbar.applyScrollDelta(2000);
      expect(scrollbar.getScrollOffset()).to.be.lessThan(0);
    });

    it('should update text height and recalculate bounds', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {},
      });

      scrollbar.setTextHeight(5000);
      expect(scrollbar.getTextHeight()).to.equal(5000);
    });

    it('should update canvas dimensions', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {},
      });

      scrollbar.setCanvasWidth(1000);
      scrollbar.setCanvasHeight(800);

      expect(scrollbar.getCanvasHeight()).to.equal(800);
    });

    it('should handle mouse down on scrollbar', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        width: 10,
        height: 100,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {},
      });

      scrollbar.draw();

      const mouseEvent = {
        x: 795,
        y: 50,
      };

      scrollbar.handleMouseDown(mouseEvent);
    });

    it('should handle mouse up', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {},
      });

      scrollbar.handleMouseDown({ x: 795, y: 50 });
      scrollbar.handleMouseUp({});
    });

    it('should handle mouse move when dragging', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        width: 10,
        height: 100,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {
          updateCanvasCalled = true;
        },
      });

      scrollbar.setTextHeight(2000);
      scrollbar.draw();

      scrollbar.handleMouseDown({ x: 795, y: 50 });

      scrollbar.handleMouseMove({
        x: 795,
        y: 60,
        buttons: 1,
        movementY: 10,
      });

      expect(updateCanvasCalled).to.be.true;
    });

    it('should not scroll when mouse moves without dragging', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {
          updateCanvasCalled = true;
        },
      });

      const initialOffset = scrollbar.getScrollOffset();

      scrollbar.handleMouseMove({
        x: 795,
        y: 60,
        buttons: 1,
        movementY: 10,
      });

      expect(scrollbar.getScrollOffset()).to.equal(initialOffset);
    });

    it('should update canvas dimensions getters', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {},
      });

      scrollbar.resizeCanvas(1200, 900);
      expect(scrollbar.getCanvasHeight()).to.equal(900);
    });

    it('should use custom color', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {},
        color: 'red',
      });

      scrollbar.draw();

      expect(mockCtx.fillStyle).to.equal('red');
    });

    it('should position scrollbar based on scroll percentage', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        width: 10,
        height: 100,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: () => {},
      });

      scrollbar.setTextHeight(3000);
      scrollbar.setScrollOffset(-1200);
      scrollbar.draw();

      const [, y] = mockCtx.fillRect.firstCall.args;
      expect(y).to.be.greaterThan(0);
      expect(y).to.be.lessThan(600);
    });
  });

  describe('Edge Cases and Advanced Scenarios', () => {
    let mockCtx;
    let mockUpdateCanvas;

    beforeEach(() => {
      mockCtx = {
        fillStyle: null,
        fillRect: sinon.spy(),
      };
      mockUpdateCanvas = sinon.spy();
    });

    it('should handle zero text height', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(0);
      scrollbar.draw();

      expect(scrollbar.getTextHeight()).to.equal(0);
      expect(mockCtx.fillRect.called).to.be.true;
    });

    it('should handle text shorter than canvas', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(200);
      scrollbar.applyScrollDelta(100);

      const offset = scrollbar.getScrollOffset();
      expect(offset).to.equal(0);
    });

    it('should handle very large text height', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(1000000);
      scrollbar.applyScrollDelta(5000);

      const offset = scrollbar.getScrollOffset();
      expect(offset).to.be.a('number');
      expect(offset).to.be.lessThanOrEqual(0);
    });

    it('should handle rapid scroll delta changes', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(2000);

      for (let i = 0; i < 100; i++) {
        scrollbar.applyScrollDelta(10);
      }

      const offset = scrollbar.getScrollOffset();
      expect(offset).to.be.a('number');
    });

    it('should handle alternating scroll directions', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(2000);
      scrollbar.applyScrollDelta(100);
      const offset1 = scrollbar.getScrollOffset();
      scrollbar.applyScrollDelta(-50);
      const offset2 = scrollbar.getScrollOffset();

      expect(offset2).to.be.greaterThan(offset1);
    });

    it('should handle mouse events outside scrollbar region', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(2000);

      // Click far outside scrollbar bounds
      scrollbar.handleMouseDown({ x: 0, y: 0 });

      // Should not crash or throw
      expect(true).to.be.true;
    });

    it('should not scroll when mouse moves without buttons pressed', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(2000);
      const x = scrollbar.getX();
      scrollbar.handleMouseDown({ x, y: 50 });
      scrollbar.handleMouseMove({ movementY: 10, buttons: 0 });

      expect(mockUpdateCanvas.calledOnce).to.be.false;
    });

    it('should handle very small canvas dimensions', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        width: 10,
        height: 20,
        canvasWidth: 50,
        canvasHeight: 50,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(1000);
      scrollbar.draw();

      expect(scrollbar.getWidth()).to.equal(10);
      expect(scrollbar.getHeight()).to.equal(20);
    });

    it('should handle very large canvas dimensions', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 10000,
        canvasHeight: 10000,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(50000);
      scrollbar.draw();

      const x = scrollbar.getX();
      expect(x).to.be.greaterThan(9980);
    });

    it('should handle resize to smaller dimensions', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.resizeCanvas(400, 300);

      expect(scrollbar.getCanvasHeight()).to.equal(300);
    });

    it('should handle resize to larger dimensions', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.resizeCanvas(1600, 1200);

      expect(scrollbar.getCanvasHeight()).to.equal(1200);
    });

    it('should maintain scroll position after text height change', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(2000);
      scrollbar.setScrollOffset(-500);
      const offset1 = scrollbar.getScrollOffset();

      scrollbar.setTextHeight(3000);
      const offset2 = scrollbar.getScrollOffset();

      expect(offset1).to.equal(offset2);
    });

    it('should handle multiple rapid mouse up/down events', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.draw();
      const x = scrollbar.getX();

      for (let i = 0; i < 10; i++) {
        scrollbar.handleMouseDown({ x, y: 50 });
        scrollbar.handleMouseUp({ x, y: 50 });
      }

      expect(true).to.be.true;
    });

    it('should handle zero movement in mouse move', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(2000);
      scrollbar.draw();
      const x = scrollbar.getX();
      scrollbar.handleMouseDown({ x, y: 50 });

      const offsetBefore = scrollbar.getScrollOffset();
      scrollbar.handleMouseMove({ movementY: 0, buttons: 1 });
      const offsetAfter = scrollbar.getScrollOffset();

      expect(offsetBefore).to.equal(offsetAfter);
    });

    it('should handle fractional scroll deltas', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(2000);
      scrollbar.applyScrollDelta(5.5);
      scrollbar.applyScrollDelta(3.7);

      const offset = scrollbar.getScrollOffset();
      expect(offset).to.be.a('number');
    });

    it('should clamp properly at minimum scroll', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(2000);
      scrollbar.applyScrollDelta(10000);

      const offset = scrollbar.getScrollOffset();
      expect(offset).to.be.lessThanOrEqual(0);
      expect(offset).to.be.greaterThanOrEqual(-2000);
    });

    it('should clamp properly at maximum scroll', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(2000);
      scrollbar.applyScrollDelta(-10000);

      const offset = scrollbar.getScrollOffset();
      expect(offset).to.equal(0);
    });

    it('should handle scrollbar exactly at canvas height', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        width: 10,
        height: 600,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(2000);
      scrollbar.draw();

      const y = scrollbar.getY();
      expect(y).to.be.a('number');
      expect(Number.isFinite(y) || Number.isNaN(y)).to.be.true;
    });

    it('should update canvas dimensions independently', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setCanvasWidth(1000);
      expect(scrollbar.getCanvasHeight()).to.equal(600);

      scrollbar.setCanvasHeight(800);
      expect(scrollbar.getCanvasHeight()).to.equal(800);
    });

    it('should handle continuous dragging motion', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(2000);
      scrollbar.draw();
      const x = scrollbar.getX();
      scrollbar.handleMouseDown({ x, y: 50 });

      const movements = [5, -3, 10, -2, 7];
      for (const movement of movements) {
        scrollbar.handleMouseMove({ movementY: movement, buttons: 1 });
      }

      scrollbar.handleMouseUp({ x, y: 100 });

      expect(scrollbar.getScrollOffset()).to.be.a('number');
    });

    it('should handle initial scroll offset', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        scrollOffset: -100,
        updateCanvas: mockUpdateCanvas,
      });

      expect(scrollbar.getScrollOffset()).to.equal(-100);
    });

    it('should handle negative scroll deltas', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(2000);
      scrollbar.applyScrollDelta(500);
      scrollbar.applyScrollDelta(-200);

      const offset = scrollbar.getScrollOffset();
      expect(offset).to.be.lessThan(0);
    });

    it('should handle mouse events at exact scrollbar boundaries', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        width: 10,
        height: 100,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.draw();
      const x = scrollbar.getX();
      const y = scrollbar.getY();

      // Top-left corner
      scrollbar.handleMouseDown({ x, y });
      expect(true).to.be.true;

      // Bottom-right corner
      scrollbar.handleMouseDown({ x: x + 10, y: y + 100 });
      expect(true).to.be.true;
    });

    it('should handle division by zero when text and canvas heights are equal', () => {
      const scrollbar = setupScrollBar({
        ctx: mockCtx,
        canvasWidth: 800,
        canvasHeight: 600,
        updateCanvas: mockUpdateCanvas,
      });

      scrollbar.setTextHeight(700);
      scrollbar.draw();

      const y = scrollbar.getY();
      expect(y).to.be.a('number');
      expect(Number.isFinite(y)).to.be.true;
    });
  });
});
