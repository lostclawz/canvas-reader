export const clamp = (min, max) => (num) => Math.max(min, Math.min(max, num));

export const setupScrollBar = ({
  ctx,
  width = 10,
  height = 100,
  canvasWidth,
  canvasHeight,
  scrollOffset = 0,
  updateCanvas,
  color = 'black',
}) => {
  const sb = {
    x: 0,
    y: 0,
    width,
    height,
    dragging: false,
    textHeight: 0,
    canvasWidth,
    canvasHeight,
    scrollOffset,
  };

  const pointOnScrollbar = (x, y) =>
    x >= sb.x && x <= sb.x + sb.width && y >= sb.y && y <= sb.y + sb.height;

  let clampScroll;
  let minScroll;
  const updateClampScroll = () => {
    minScroll = Math.min(-sb.textHeight + sb.canvasHeight - 100, 0);
    clampScroll = clamp(minScroll, 0);
  };
  updateClampScroll();

  return {
    draw() {
      const scrollPerc = sb.scrollOffset / minScroll;
      sb.y = (sb.canvasHeight - sb.height) * scrollPerc;
      sb.x = canvasWidth - sb.width;
      ctx.fillStyle = color;
      ctx.fillRect(sb.x, sb.y, sb.width, sb.height);
    },
    setTextHeight(txtHeight) {
      sb.textHeight = txtHeight;
      updateClampScroll();
    },
    setCanvasHeight(height) {
      sb.canvasHeight = height;
      updateClampScroll();
    },
    setCanvasWidth(width) {
      sb.canvasWidth = width;
      updateClampScroll();
    },
    resizeCanvas(width, height) {
      sb.canvasWidth = width;
      sb.canvasHeight = height;
    },
    applyScrollDelta(delta) {
      this.setScrollOffset(clampScroll(sb.scrollOffset - delta));
    },
    setScrollOffset(offset) {
      sb.scrollOffset = offset;
      updateCanvas();
    },
    handleMouseDown(e) {
      if (pointOnScrollbar(e.x, e.y)) {
        sb.dragging = true;
      }
    },
    handleMouseUp(_e) {
      if (sb.dragging) {
        sb.dragging = false;
      }
    },
    handleMouseMove(e) {
      if (sb.dragging && e.buttons) {
        this.applyScrollDelta(e.movementY);
      }
    },
    getScrollOffset: () => sb.scrollOffset,
    getX: () => sb.x,
    getY: () => sb.y,
    getWidth: () => sb.width,
    getHeight: () => sb.height,
    getTextHeight: () => sb.textHeight,
    getCanvasHeight: () => sb.canvasHeight,
  };
};
