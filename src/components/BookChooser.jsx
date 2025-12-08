import { useEffect, useState } from 'react';
import { HOST, NODE_SERVER_PORT } from '../constants/constants';

const BookChooser = ({ onSelect }) => {
  const [books, setBooks] = useState(null);
  // retrieve a list of available books from the server
  useEffect(() => {
    fetch(`http://${HOST}:${NODE_SERVER_PORT}/api/books`)
      .then((res) => res.json())
      .then(setBooks);
  }, []);
	console.log(books);
  return (
    books && (
      <ul className="book-chooser list-unstyled">
        {books.results.map((b) => (
          <li key={b.id}>
            <button type="button" onClick={() => onSelect(b)}>
              {b.title}
            </button>
          </li>
        ))}
      </ul>
    )
  );
};
export default BookChooser;
