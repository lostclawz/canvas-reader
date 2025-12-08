# Server

Express server for the canvas reader application.

## Structure

```
server/
├── index.js          # Main server entry point, middleware setup
└── routes/           # Route handlers
    ├── books.js      # Book list and book text endpoints
    ├── cache.js      # Cache management endpoints
    └── health.js     # Health check endpoint
```

## Routes

### Book Routes (`/api`)
- `GET /api/books` - Fetch list of books from Gutendex API (cached 5 minutes)
- `GET /api/book-text?url=<url>` - Fetch book text content (cached 1 hour)

### Cache Routes (`/api/cache`)
- `GET /api/cache/stats` - View cache performance metrics
- `GET /api/cache/index` - View all cached URLs
- `DELETE /api/cache` - Clear all cached data

### Health Route
- `GET /health` - Health check endpoint

## Running

```bash
npm run server
```

Server runs on `http://localhost:3001` (configurable via `PORT` env variable).

## Caching

Uses [apicache](https://github.com/kwhitley/apicache) middleware for in-memory response caching.
