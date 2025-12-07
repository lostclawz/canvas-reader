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

- `npm run dev` - Start Vite development server
- `npm run server` - Start Express proxy server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests

## Development

The application uses:
- **Vite** for fast development and building
- **React 18** for the UI
- **Express** for the proxy server
- **Web Workers** for text processing
- **Mocha/Chai/Sinon** for testing

## How It Works

1. User selects a book from the Gutendex API
2. The book's text URL is sent to the local Express server
3. Express server fetches the text and returns it (avoiding CORS)
4. The text is processed by a Web Worker
5. Text is rendered on an HTML canvas with a custom scrollbar
6. Users can search and scroll through the text
