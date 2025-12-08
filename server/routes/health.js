/**
 * @fileoverview Health check route.
 * Provides a simple endpoint for monitoring server status.
 */

import { Router } from 'express';

const router = Router();

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
router.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

export default router;
