/**
 * @fileoverview Express server for the canvas reader application.
 * Provides API endpoints to fetch book lists and book content from external sources.
 * Acts as a proxy server to handle CORS restrictions when accessing book data.
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';

import booksRoutes from './routes/books.js';
import cacheRoutes from './routes/cache.js';
import healthRoutes from './routes/health.js';
import searchRoutes from './routes/search.js';

const app = express();
/** Server port number from environment variable or default to 3001 @type {number} */
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Mount route handlers
app.use('/api', booksRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/health', healthRoutes);
app.use('/api', searchRoutes);

/**
 * Start the server listener.
 * Only starts if this file is executed directly (not imported as a module).
 * This allows the app to be imported for testing without starting the server.
 */
const isMainModule = fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
  });
}

export default app;
