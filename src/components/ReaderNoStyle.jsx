/**
 * @fileoverview Top-level reader component that combines book selection and canvas rendering.
 * Provides a complete reading interface with book chooser, search input, and canvas reader.
 */

import React, { memo, useState } from 'react';
import { HOST, NODE_SERVER_PORT } from '../constants/constants';
import BookChooser from './BookChooser.jsx';
import CanvasReader from './CanvasReader.jsx';

/**
 * Reader component props.
 * @typedef {Object} ReaderProps
 * @property {number} [size=800] - Canvas dimensions (width and height in pixels)
 * @property {number} [fontSize=15] - Default font size for text rendering
 */

/**
 * Main reader component that orchestrates the reading experience.
 * Combines a BookChooser for selecting books, a search input for finding text,
 * and a CanvasReader for rendering the book content. Manages state for the
 * currently selected book and search query.
 *
 * The component is memoized to prevent unnecessary re-renders.
 *
 * @param {ReaderProps} props - Component configuration props
 * @returns {React.ReactElement} Complete reader interface with book selection and rendering
 *
 * @example
 * // Default configuration (800x800 canvas, 15px font)
 * <Reader />
 *
 * @example
 * // Custom size and font
 * <Reader size={1000} fontSize={18} />
 */
const Reader = memo(({ size = 800, fontSize = 15 }) => {
  const [book, setBook] = useState(null);
  const [searchText, setSearchText] = useState('');
  const route = book ? `http://${HOST}:${NODE_SERVER_PORT}/books/?file=${book}` : '';
  return (
    <div className="reader">
      <div>
        <BookChooser onSelect={setBook} />
        <div style={{ marginTop: 12 }}>
          <input
            type="text"
            placeholder="Search text..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>
      <CanvasReader
        key={route}
        route={route}
        canvasWidth={size}
        canvasHeight={size}
        size={fontSize}
        searchText={searchText}
      />
    </div>
  );
});

export default Reader;
