/**
 * @fileoverview Scrollbar implementation for canvas-based text rendering.
 * Provides a draggable scrollbar with automatic positioning based on scroll percentage.
 */

/**
 * Creates a curried clamping function that restricts a number to a specified range.
 *
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {Function} A function that takes a number and returns it clamped to [min, max]
 *
 * @example
 * const clamp0to100 = clamp(0, 100);
 * clamp0to100(150); // returns 100
 * clamp0to100(-10); // returns 0
 * clamp0to100(50);  // returns 50
 */
export const clamp = (min, max) => (num) => Math.max(min, Math.min(max, num));

/**
 * Configuration object for scroll bar setup.
 * @typedef {Object} ScrollBarConfig
 * @property {CanvasRenderingContext2D} ctx - Canvas 2D rendering context for drawing
 * @property {number} [width=10] - Width of the scrollbar in pixels
 * @property {number} [height=100] - Height of the scrollbar in pixels
 * @property {number} canvasWidth - Total width of the canvas
 * @property {number} canvasHeight - Total height of the canvas
 * @property {number} [scrollOffset=0] - Initial scroll offset (negative values scroll down)
 * @property {Function} updateCanvas - Callback function to trigger canvas redraw
 * @property {string} [color='black'] - Color of the scrollbar
 */

/**
 * Scrollbar instance with methods for drawing and interaction handling.
 * @typedef {Object} ScrollBar
 * @property {Function} draw - Render the scrollbar at its current position
 * @property {Function} setTextHeight - Update the total height of scrollable text
 * @property {Function} setCanvasHeight - Update the canvas height
 * @property {Function} setCanvasWidth - Update the canvas width
 * @property {Function} resizeCanvas - Update both canvas dimensions
 * @property {Function} applyScrollDelta - Apply a scroll movement delta
 * @property {Function} setScrollOffset - Set the scroll position directly
 * @property {Function} handleMouseDown - Handle mouse button press events
 * @property {Function} handleMouseUp - Handle mouse button release events
 * @property {Function} handleMouseMove - Handle mouse movement for dragging
 * @property {Function} getScrollOffset - Get current scroll offset
 * @property {Function} getX - Get current X position
 * @property {Function} getY - Get current Y position
 * @property {Function} getWidth - Get scrollbar width
 * @property {Function} getHeight - Get scrollbar height
 * @property {Function} getTextHeight - Get total text height
 * @property {Function} getCanvasHeight - Get canvas height
 */

/**
 * Creates and initializes a scrollbar for canvas-based content.
 * The scrollbar automatically positions itself based on the scroll percentage and
 * supports dragging to scroll through content.
 *
 * @param {ScrollBarConfig} config - Configuration object for the scrollbar
 * @returns {ScrollBar} Scrollbar instance with methods for interaction and rendering
 *
 * @example
 * const scrollbar = setupScrollBar({
 *   ctx: canvas.getContext('2d'),
 *   canvasWidth: 800,
 *   canvasHeight: 600,
 *   updateCanvas: () => renderContent(),
 *   color: '#333'
 * });
 *
 * // Set content height
 * scrollbar.setTextHeight(5000);
 *
 * // Draw scrollbar
 * scrollbar.draw();
 *
 * // Handle mouse events
 * canvas.addEventListener('mousedown', scrollbar.handleMouseDown);
 * canvas.addEventListener('mouseup', scrollbar.handleMouseUp);
 * canvas.addEventListener('mousemove', scrollbar.handleMouseMove);
 */
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
  /** @type {{x: number, y: number, width: number, height: number, dragging: boolean, textHeight: number, canvasWidth: number, canvasHeight: number, scrollOffset: number}} */
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

  /**
   * Checks if a point is within the scrollbar bounds.
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if point is on the scrollbar
   */
  const pointOnScrollbar = (x, y) =>
    x >= sb.x && x <= sb.x + sb.width && y >= sb.y && y <= sb.y + sb.height;

  let clampScroll;
  let minScroll;

  /**
   * Updates the scroll clamping function based on current text and canvas heights.
   * @private
   */
  const updateClampScroll = () => {
    minScroll = Math.min(-sb.textHeight + sb.canvasHeight - 100, 0);
    clampScroll = clamp(minScroll, 0);
  };
  updateClampScroll();

  return {
    /**
     * Draws the scrollbar on the canvas at its current position.
     * Position is calculated based on scroll percentage.
     */
    draw() {
      const scrollPerc = sb.scrollOffset / minScroll;
      sb.y = (sb.canvasHeight - sb.height) * scrollPerc;
      sb.x = canvasWidth - sb.width;
      ctx.fillStyle = color;
      ctx.fillRect(sb.x, sb.y, sb.width, sb.height);
    },

    /**
     * Updates the total height of scrollable text content.
     * Recalculates scroll bounds when text height changes.
     * @param {number} txtHeight - Total height of text content in pixels
     */
    setTextHeight(txtHeight) {
      sb.textHeight = txtHeight;
      updateClampScroll();
    },

    /**
     * Updates the canvas height and recalculates scroll bounds.
     * @param {number} height - New canvas height in pixels
     */
    setCanvasHeight(height) {
      sb.canvasHeight = height;
      updateClampScroll();
    },

    /**
     * Updates the canvas width and recalculates scroll bounds.
     * @param {number} width - New canvas width in pixels
     */
    setCanvasWidth(width) {
      sb.canvasWidth = width;
      updateClampScroll();
    },

    /**
     * Resizes the canvas to new dimensions.
     * @param {number} width - New canvas width in pixels
     * @param {number} height - New canvas height in pixels
     */
    resizeCanvas(width, height) {
      sb.canvasWidth = width;
      sb.canvasHeight = height;
    },

    /**
     * Applies a scroll movement delta, clamping to valid range.
     * @param {number} delta - Amount to scroll (positive scrolls down)
     */
    applyScrollDelta(delta) {
      this.setScrollOffset(clampScroll(sb.scrollOffset - delta));
    },

    /**
     * Sets the scroll offset directly and triggers canvas update.
     * @param {number} offset - New scroll offset (0 is top, negative values scroll down)
     */
    setScrollOffset(offset) {
      sb.scrollOffset = offset;
      updateCanvas();
    },

    /**
     * Handles mouse down events. Enables dragging if clicked on scrollbar.
     * @param {{x: number, y: number}} e - Mouse event with x,y coordinates
     */
    handleMouseDown(e) {
      if (pointOnScrollbar(e.x, e.y)) {
        sb.dragging = true;
      }
    },

    /**
     * Handles mouse up events. Disables dragging.
     * @param {MouseEvent} _e - Mouse event (unused)
     */
    handleMouseUp(_e) {
      if (sb.dragging) {
        sb.dragging = false;
      }
    },

    /**
     * Handles mouse move events. Scrolls if dragging.
     * @param {{movementY: number, buttons: number}} e - Mouse event with movement delta and button state
     */
    handleMouseMove(e) {
      if (sb.dragging && e.buttons) {
        this.applyScrollDelta(e.movementY);
      }
    },

    /** @returns {number} Current scroll offset */
    getScrollOffset: () => sb.scrollOffset,
    /** @returns {number} Current X position of scrollbar */
    getX: () => sb.x,
    /** @returns {number} Current Y position of scrollbar */
    getY: () => sb.y,
    /** @returns {number} Scrollbar width in pixels */
    getWidth: () => sb.width,
    /** @returns {number} Scrollbar height in pixels */
    getHeight: () => sb.height,
    /** @returns {number} Total text height in pixels */
    getTextHeight: () => sb.textHeight,
    /** @returns {number} Canvas height in pixels */
    getCanvasHeight: () => sb.canvasHeight,
  };
};
