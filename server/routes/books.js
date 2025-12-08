/**
 * @fileoverview Book-related API routes.
 * Handles fetching book lists and book content from external sources.
 */

import apicache from 'apicache';
import { Router } from 'express';

const router = Router();
const cache = apicache.middleware;

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
router.get('/books', cache('1 day'), async (_req, res) => {
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
router.get('/book-text', cache('1 day'), async (req, res) => {
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

export default router;
