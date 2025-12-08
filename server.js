/**
 * @fileoverview Express server for the canvas reader application.
 * Provides API endpoints to fetch book lists and book content from external sources.
 * Acts as a proxy server to handle CORS restrictions when accessing book data.
 */

import express from 'express';
import cors from 'cors';

const app = express();
/** Server port number from environment variable or default to 3001 @type {number} */
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

/**
 * GET /api/books - Fetches a list of available books from the Gutendex API.
 * Returns paginated book data including titles, authors, and download links.
 *
 * @route GET /api/books
 * @returns {Object} JSON response with book list
 * @returns {number} response.count - Total number of books available
 * @returns {string|null} response.next - URL for next page of results
 * @returns {string|null} response.previous - URL for previous page of results
 * @returns {Array<Object>} response.results - Array of book objects
 * @throws {500} If the Gutendex API request fails
 *
 * @example
 * // Response format:
 * {
 *   "count": 77232,
 *   "next": "https://gutendex.com/books/?page=2",
 *   "previous": null,
 *   "results": [
 *     {
 *       "id": 84,
 *       "title": "Frankenstein; Or, The Modern Prometheus",
 *       "authors": [...],
 *       "formats": { "text/plain; charset=us-ascii": "https://..." }
 *     }
 *   ]
 * }
 */
app.get('/api/books', async (_req, res) => {
  try {
    console.log('Fetching books from Gutendex...');
    const response = await fetch('https://gutendex.com/books');

    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/book-text - Proxies requests to fetch book text content.
 * Downloads the full text of a book from a provided URL and returns it as plain text.
 * This endpoint bypasses CORS restrictions that would prevent direct browser requests.
 *
 * @route GET /api/book-text
 * @queryparam {string} url - URL of the book text file to fetch (required)
 * @returns {string} Plain text content of the book
 * @throws {400} If the url query parameter is missing
 * @throws {500} If fetching the book content fails
 *
 * @example
 * // Request:
 * GET /api/book-text?url=https://www.gutenberg.org/files/84/84-0.txt
 *
 * // Response:
 * Content-Type: text/plain
 * [Full book text content...]
 */
app.get('/api/book-text', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    console.log(`Fetching book from: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const text = await response.text();
    res.type('text/plain').send(text);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /health - Health check endpoint for monitoring server status.
 * Returns a simple JSON response indicating the server is running.
 *
 * @route GET /health
 * @returns {Object} JSON response with status
 * @returns {string} response.status - Always returns "ok" when server is healthy
 *
 * @example
 * // Response:
 * { "status": "ok" }
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Start the server listener.
 * Only starts if this file is executed directly (not imported as a module).
 * This allows the app to be imported for testing without starting the server.
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
