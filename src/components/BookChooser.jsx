/**
 * @fileoverview Book selection component for the canvas reader application.
 * Fetches available books from the server and displays them as a selectable list.
 */

import React, { useEffect, useState } from 'react';
import { HOST, NODE_SERVER_PORT } from '../constants/constants';

/**
 * Book object returned from the API.
 * @typedef {Object} Book
 * @property {number|string} id - Unique identifier for the book
 * @property {string} title - Display title of the book
 * @property {string} [author] - Author name (if available)
 * @property {string} [file] - File path or identifier for the book content
 */

/**
 * BookChooser component props.
 * @typedef {Object} BookChooserProps
 * @property {function(Book): void} onSelect - Callback invoked when a book is selected
 */

/**
 * React component that fetches and displays a list of available books.
 * Retrieves the book list from the server on mount and renders clickable buttons
 * for each book. When a book is selected, the onSelect callback is invoked.
 *
 * @param {BookChooserProps} props - Component props
 * @returns {React.ReactElement|null} List of book selection buttons, or null while loading
 *
 * @example
 * <BookChooser onSelect={(book) => console.log('Selected:', book.title)} />
 */
const BookChooser = ({ onSelect }) => {
  const [books, setBooks] = useState(null);
  // retrieve a list of available books from the server
  useEffect(() => {
    fetch(`http://${HOST}:${NODE_SERVER_PORT}/api/books`)
      .then((res) => res.json())
      .then(setBooks);
  }, []);
  return (
    books && (
      <ul className="book-chooser list-unstyled">
        {books.results.map((b) => (
          <li key={b.id}>
            <button type="button" onClick={() => onSelect(b)}>
              {b.title}
            </button>
          </li>
        ))}
      </ul>
    )
  );
};
export default BookChooser;
