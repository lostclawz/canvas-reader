# Canvas Reader

A React-based text reader application that renders books on an HTML canvas with search functionality.

## Features

- **Book Discovery**: Search and browse books from the Gutendex (Project Gutenberg) API
- **Advanced Text Search**: Search within book content with contextual results (shows matching line plus one line before and after for better context)
- **Search Term Highlighting**: Search matches are highlighted with yellow highlighting for easy identification
- **Line Numbers**: Display original line numbers from the text file on the right side of the canvas, even in search results
- **Canvas Rendering**: High-performance text rendering on HTML canvas with customizable font settings
- **Web Worker Processing**: Text processing runs off the main thread for smooth UI performance
- **Auto-scroll**: Configurable automatic scrolling through books
- **Custom Scrollbar**: Responsive scrollbar with drag-to-scroll functionality
- **Responsive Design**: Works across different screen sizes

## Project Structure

```
canvas-reader/
├── src/
│   ├── components/       # React components
│   ├── constants/        # Constants and configuration
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── workers/          # Web workers
│   ├── styles/           # CSS files
│   └── main.jsx          # Application entry point
├── server/
│   ├── routes/           # Express route handlers
│   │   └── search.js     # Gutendex search API proxy
│   ├── __tests__/        # Server tests
│   └── index.js          # Express server configuration
├── __tests__/            # Global test configuration
└── index.html            # Entry HTML
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
npm install
```

### Running the Application

You need to run **two** processes:

1. **Start the Express proxy server** (handles CORS for book text fetching):
   ```bash
   npm run server
   ```
   Server will run on http://localhost:3001

2. **Start the Vite dev server** (in a new terminal):
   ```bash
   npm run dev
   ```
   Application will run on http://localhost:5173

Then open http://localhost:5173 in your browser.

### Why Two Servers?

The Express server acts as a proxy to fetch book content from external sources without CORS issues. The Vite dev server serves the React application.

## Available Scripts

### Development
- `npm run dev` - Start Vite development server
- `npm run server` - Start Express proxy server

### Building
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Testing
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage report

### Code Quality
- `npm run lint` - Check code with Biome linter
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Biome

## Development

The application uses:
- **Vite** for fast development and building
- **React 18** for the UI
- **Express** for the proxy server
- **Web Workers** for text processing
- **Mocha/Chai/Sinon** for testing
- **Supertest** for API testing
- **nyc** for test coverage
- **Biome** for linting and formatting

## How It Works

### Book Discovery Flow
1. User enters search terms in the BookSearch component
2. Express server proxies the request to Gutendex API
3. Results are filtered to show only books with plain text format
4. User selects a book from the results

### Book Reading Flow
1. Selected book's text URL is sent to the local Express server
2. Express server fetches the text and returns it (avoiding CORS)
3. The text is processed by a Web Worker for optimal performance
4. Text is wrapped to fit the canvas width while preserving original line numbers
5. Text is rendered on an HTML canvas with line numbers on the right side
6. Users can search within the book and scroll through the text

### In-Book Search Feature
The search functionality provides contextual results with advanced features:
- When you search for text within a book, results show the matching line **plus one line before and one line after**
- **Search term highlighting**: All occurrences of the search term are highlighted with a yellow background
- **Line number preservation**: Original line numbers from the text file are displayed on the right side, even in search results
- This provides better context for understanding search results
- Overlapping context windows are automatically deduplicated
- Search is case-insensitive
- Results update in real-time as you type
- Highlighting works with multiple matches per line and supports Unicode characters

## API Endpoints

The Express server provides the following endpoints:

- `GET /api/books` - Fetch list of books from Gutendex API (cached)
- `GET /api/search?q=<search-query>&page=<page-number>` - Search for books by title, author, or subject in Gutendex API
  - Query parameter `q` (required): Search query string
  - Query parameter `page` (optional): Page number for pagination
  - Returns paginated results from the Gutendex API
  - **Note**: This endpoint is NOT cached to always provide fresh search results
- `GET /api/book-text?url=<encoded-url>` - Proxy book text content (avoids CORS issues, cached)
- `GET /health` - Health check endpoint

All endpoints include CORS headers. Book list and text content endpoints implement caching for improved performance, while the search endpoint provides fresh results for each query.

## Code Quality

### Testing

The project has comprehensive test coverage including:

**Frontend Tests**:
- Component tests (BookChooser, BookSearch, CanvasReader, Reader)
- Hook tests (custom React hooks like useReaderAutoScroll)
- Utility function tests (text processing, search, scrollbar, measurements)
  - Line number preservation (`reduceLinesWithNumbers`)
  - Search with line numbers (`quickStringSearchWithNumbers`)
  - Text wrapping and line breaking
  - Unicode character handling
- Worker tests (Web Worker message handling)
- Constants tests

**Backend Tests**:
- API endpoint tests (using Supertest)
  - Book search endpoint with query validation
  - Pagination support
  - Special character encoding
- Error handling tests
- CORS configuration tests
- Edge case tests

**Total: 261 tests passing**

Key test coverage areas:
- Text search with context lines (before/after matching lines)
- Line number preservation during text wrapping and searching
- Canvas text rendering and layout
- Search term highlighting functionality
- Scrollbar interaction and positioning
- Book search and filtering
- API proxy functionality
- Unicode character support in search

#### Test Coverage

The project uses **nyc** for test coverage. Coverage thresholds are set to 80% for:
- Lines
- Statements
- Functions
- Branches

Run `npm run test:coverage` to generate a coverage report. HTML reports are available in the `coverage/` directory.

### Linting and Formatting

The project uses **Biome** for fast linting and formatting:
- Modern, fast alternative to ESLint + Prettier
- Configured for React/JSX
- Automatic import organization
- Consistent code style

Configuration is in [biome.json](biome.json).
