# Canvas Reader

A React-based text reader application that renders books on an HTML canvas with search functionality.

## Features

- Fetches books from Gutendex API
- Renders text on canvas with customizable font settings
- Search functionality
- Auto-scroll capability
- Custom scrollbar implementation

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
├── tests/                # Test files
├── server.js             # Express proxy server
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

1. Express server fetches the book list from Gutendex API
2. User selects a book from the list
3. The book's text URL is sent to the local Express server
4. Express server fetches the text and returns it (avoiding CORS)
5. The text is processed by a Web Worker
6. Text is rendered on an HTML canvas with a custom scrollbar
7. Users can search and scroll through the text

## API Endpoints

The Express server provides the following endpoints:

- `GET /api/books` - Fetch list of books from Gutendex API
- `GET /api/book-text?url=<encoded-url>` - Proxy book text content
- `GET /health` - Health check endpoint

## Code Quality

### Testing

The project has comprehensive test coverage including:

**Frontend Tests** (90 tests):
- Component tests (React components)
- Hook tests (custom React hooks)
- Utility function tests
- Worker tests
- Constants tests

**Backend Tests** (27 tests):
- API endpoint tests (using Supertest)
- Error handling tests
- CORS configuration tests
- Edge case tests

**Total: 117 tests passing**

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
