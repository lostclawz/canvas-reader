import { expect } from 'chai';
import sinon from 'sinon';
import { clamp, setupScrollBar } from '../src/utils/scrollbar.js';

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
});
