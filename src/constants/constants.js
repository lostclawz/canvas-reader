/**
 * @fileoverview Application-wide constants for the canvas reader.
 * Defines message types for worker communication and server configuration.
 */

/**
 * Standard line break character used throughout the application.
 * @type {string}
 * @constant
 */
export const LINE_BREAK = '\n';

/**
 * Message types for communication between the main thread and the reader worker.
 * These messages control the canvas rendering, scrolling, and user interactions.
 * @typedef {Object} MessageTypes
 * @property {string} INIT - Initialize the worker with canvas and configuration
 * @property {string} KILL - Terminate the worker and clean up resources
 * @property {string} SCROLL - Update scroll position
 * @property {string} UPDATE - Update canvas settings (font size, dimensions, etc.)
 * @property {string} SEARCH - Search for text within the document
 * @property {string} MOUSE_DOWN - Mouse button pressed
 * @property {string} MOUSE_UP - Mouse button released
 * @property {string} MOUSE_MOVE - Mouse moved
 */
export const MESSAGES = {
  INIT: 'INIT',
  KILL: 'KILL',
  SCROLL: 'SCROLL',
  UPDATE: 'UPDATE',
  SEARCH: 'SEARCH',
  MOUSE_DOWN: 'MOUSE_DOWN',
  MOUSE_UP: 'MOUSE_UP',
  MOUSE_MOVE: 'MOUSE_MOVE',
};

/**
 * Local server hostname for development and book fetching.
 * @type {string}
 * @constant
 */
export const HOST = 'localhost';

/**
 * Port number for the Node.js Express server that proxies book requests.
 * @type {number}
 * @constant
 */
export const NODE_SERVER_PORT = 3001;
