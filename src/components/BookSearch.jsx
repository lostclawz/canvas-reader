import React, { useState } from 'react';
import { HOST, NODE_SERVER_PORT } from '../constants/constants';

/**
 * Author data structure from Gutendex API.
 * @typedef {Object} Author
 * @property {string} name - Author's full name
 * @property {number} [birth_year] - Year of birth
 * @property {number} [death_year] - Year of death
 */

/**
 * Book data structure from Gutendex API.
 * @typedef {Object} GutendexBook
 * @property {number} id - Unique book identifier from Project Gutenberg
 * @property {string} title - Book title
 * @property {Author[]} authors - Array of author objects
 * @property {Object.<string, string>} formats - Available book formats with URLs (e.g., 'text/plain', 'application/epub+zip')
 * @property {string[]} [subjects] - Book subject classifications
 * @property {string[]} [bookshelves] - Project Gutenberg bookshelf categories
 * @property {string[]} [languages] - ISO 639-1 language codes
 * @property {number} [download_count] - Number of times the book has been downloaded
 */

/**
 * API response structure from Gutendex.
 * @typedef {Object} GutendexResponse
 * @property {number} count - Total number of matching books in the database
 * @property {string|null} next - URL for the next page of results (null if last page)
 * @property {string|null} previous - URL for the previous page of results (null if first page)
 * @property {GutendexBook[]} results - Array of book results for current page
 */

/**
 * Component props for BookSearch.
 * @typedef {Object} BookSearchProps
 * @property {(textUrl: string) => void} onChoose - Callback function called when a book is selected.
 *   Receives the URL to the book's plain text format.
 */

/**
 * Book search component that searches the Gutendex (Project Gutenberg) API via the server.
 * Allows users to search for public domain books and select one to read.
 * Only displays books that have a plain text format available.
 *
 * Features:
 * - Real-time search input validation
 * - Loading states during API calls
 * - Error handling with user-friendly messages
 * - Filters to show only books with plain text format
 * - Displays author names and book titles
 * - Shows result counts
 *
 * The component uses the local Express server as a proxy to avoid CORS issues
 * when fetching data from the Gutendex API.
 *
 * @component
 * @param {BookSearchProps} props - Component props
 * @param {(textUrl: string) => void} props.onChoose - Callback invoked with the book's text/plain URL when selected
 * @returns {JSX.Element} Search form and results list
 *
 * @example
 * // Basic usage
 * <BookSearch onChoose={(textUrl) => loadBook(textUrl)} />
 *
 * @example
 * // With state management
 * const [selectedBookUrl, setSelectedBookUrl] = useState(null);
 * <BookSearch onChoose={(url) => setSelectedBookUrl(url)} />
 */
const BookSearch = ({ onChoose }) => {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handles the search form submission.
   * Fetches books from the server API which proxies to Gutendex.
   * @param {Event} e - Form submit event
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://${HOST}:${NODE_SERVER_PORT}/api/search?q=${encodeURIComponent(searchText)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Filter to only show books with text/plain format
      const booksWithText = data.results.filter((book) => book.formats?.['text/plain']);
      setResults({ ...data, results: booksWithText });
    } catch (err) {
      setError(err.message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formats the author list for display.
   * @param {Array<{name: string}>} authors - Array of author objects
   * @returns {string} Comma-separated list of author names
   */
  const formatAuthors = (authors) => {
    if (!authors || authors.length === 0) return 'Unknown Author';
    return authors.map((author) => author.name).join(', ');
  };

  /**
   * Handles book selection.
   * Calls the onChoose callback with the book's plain text URL.
   * @param {GutendexBook} book - Selected book object
   */
  const handleChoose = (book) => {
    const textUrl = book.formats['text/plain'];
    if (textUrl) {
      onChoose(textUrl);
    }
  };

  return (
    <div className="book-search">
      <form onSubmit={handleSearch} className="book-search-form">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search Project Gutenberg..."
          className="book-search-input"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !searchText.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="book-search-error">Error: {error}</div>}

      {results && (
        <div className="book-search-results">
          <p className="book-search-count">
            {results.results.length} book{results.results.length !== 1 ? 's' : ''} found
            {results.results.length < results.count && ` (showing only books with text format)`}
          </p>
          <ul className="book-search-list list-unstyled">
            {results.results.map((book) => (
              <li key={book.id} className="book-search-item">
                <button
                  type="button"
                  onClick={() => handleChoose(book)}
                  className="book-search-button"
                >
                  <div className="book-title">{book.title}</div>
                  <div className="book-authors">{formatAuthors(book.authors)}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {results && results.results.length === 0 && (
        <div className="book-search-empty">No books with text format found for "{searchText}"</div>
      )}
    </div>
  );
};

export default BookSearch;
