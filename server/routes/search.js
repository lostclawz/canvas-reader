/**
 * @fileoverview Search-related API routes.
 * Handles searching for books using the Gutendex API.
 */

import { Router } from 'express';

const router = Router();

/**
 * GET /api/search - Searches for books using the Gutendex API.
 * Returns paginated search results based on the query string.
 *
 * @route GET /api/search
 * @queryparam {string} q - Search query string (required)
 * @queryparam {number} page - Page number for pagination (optional)
 * @returns {Object} JSON response with search results
 * @returns {number} response.count - Total number of matching books
 * @returns {string|null} response.next - URL for next page of results
 * @returns {string|null} response.previous - URL for previous page of results
 * @returns {Array<Object>} response.results - Array of matching book objects
 * @throws {400} If the query parameter is missing
 * @throws {500} If the Gutendex API request fails
 *
 * @example
 * // Request:
 * GET /api/search?q=alice+wonderland
 *
 * // Response format:
 * {
 *   "count": 12,
 *   "next": null,
 *   "previous": null,
 *   "results": [
 *     {
 *       "id": 11,
 *       "title": "Alice's Adventures in Wonderland",
 *       "authors": [...],
 *       "formats": { "text/plain; charset=us-ascii": "https://..." }
 *     }
 *   ]
 * }
 */
router.get('/search', async (req, res) => {
  const { q, page } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    // Build the Gutendex API URL with search query
    const searchParams = new URLSearchParams({ search: q });
    if (page) {
      searchParams.append('page', page);
    }

    const apiUrl = `https://gutendex.com/books?${searchParams.toString()}`;
    console.log(`Searching Gutendex for: "${q}"${page ? ` (page ${page})` : ''}`);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to search books: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error searching books:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
