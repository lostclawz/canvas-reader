/**
 * @fileoverview Cache management routes.
 * Provides endpoints for monitoring and managing the API cache.
 */

import apicache from 'apicache';
import { Router } from 'express';

const router = Router();

/**
 * GET /api/cache/stats - Returns cache statistics.
 * Shows cache performance metrics and index information.
 *
 * @route GET /api/cache/stats
 * @returns {Object} JSON response with cache statistics
 *
 * @example
 * // Response includes cache index, performance metrics, etc.
 */
router.get('/stats', (_req, res) => {
  res.json(apicache.getPerformance());
});

/**
 * GET /api/cache/index - Returns the cache index showing all cached URLs.
 *
 * @route GET /api/cache/index
 * @returns {Object} JSON response with cache index
 */
router.get('/index', (_req, res) => {
  res.json(apicache.getIndex());
});

/**
 * DELETE /api/cache - Clears all cached data.
 *
 * @route DELETE /api/cache
 * @returns {Object} JSON response confirming cache clear
 * @returns {string} response.message - Confirmation message
 *
 * @example
 * // Response:
 * { "message": "Cache cleared" }
 */
router.delete('/', (_req, res) => {
  apicache.clear();
  console.log('Cache cleared');
  res.json({ message: 'Cache cleared' });
});

export default router;
