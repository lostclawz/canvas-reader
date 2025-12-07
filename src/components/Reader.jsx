import '../styles/reader.css';
import React, { memo, useState } from 'react';
import BookChooser from './BookChooser.jsx';
import CanvasReader from './CanvasReader.jsx';
import { HOST, NODE_SERVER_PORT } from '../constants/constants';

const Reader = memo(({ size = 800, fontSize = 15 }) => {
  const [book, setBook] = useState(null);
  const [searchText, setSearchText] = useState('');
	console.log(book);
  const route = book
    ? `http://${HOST}:${NODE_SERVER_PORT}/api/book-text?url=${encodeURIComponent(book?.formats['text/plain; charset=us-ascii'])}`
    : '';
	console.log('route', route);
  return (
    <div className="reader">
      <div>
        <BookChooser onSelect={setBook} />
        <div style={{ marginTop: 12 }}>
          <input
            type="text"
            placeholder="Search text..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>
      <CanvasReader
        key={route}
        route={route}
        canvasWidth={size}
        canvasHeight={size}
        size={fontSize}
        searchText={searchText}
      />
    </div>
  );
});

export default Reader;
