/**
 * @fileoverview Styled reader component with complete reading interface.
 * Similar to ReaderNoStyle but includes CSS styling and handles book formats.
 */

import '../styles/reader.css';
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
 * Main styled reader component with book selection and rendering capabilities.
 * Includes CSS styling and constructs book routes from the book's format data.
 * Combines BookChooser, search input, and CanvasReader into a complete interface.
 *
 * The component is memoized to prevent unnecessary re-renders.
 *
 * @param {ReaderProps} props - Component configuration props
 * @returns {React.ReactElement} Styled reader interface with book selection and rendering
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
  const route = book
    ? `http://${HOST}:${NODE_SERVER_PORT}/api/book-text?url=${encodeURIComponent(book?.formats['text/plain; charset=us-ascii'])}`
    : '';
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
