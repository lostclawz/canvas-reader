import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';
import BookSearch from '../BookSearch';

describe('BookSearch', () => {
  let onChooseSpy;

  beforeEach(() => {
    onChooseSpy = sinon.spy();
    global.fetch = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
    delete global.fetch;
  });

  it('renders search form', () => {
    render(<BookSearch onChoose={onChooseSpy} />);
    const input = screen.getByPlaceholderText('Search Project Gutenberg...');
    const button = screen.getByText('Search');

    expect(input).to.exist;
    expect(button).to.exist;
  });

  it('search button is disabled when input is empty', () => {
    render(<BookSearch onChoose={onChooseSpy} />);
    const button = screen.getByText('Search');

    expect(button.disabled).to.be.true;
  });

  it('search button is enabled when input has text', () => {
    render(<BookSearch onChoose={onChooseSpy} />);
    const input = screen.getByPlaceholderText('Search Project Gutenberg...');
    const button = screen.getByText('Search');

    fireEvent.change(input, { target: { value: 'Tolstoy' } });

    expect(button.disabled).to.be.false;
  });

  it('fetches books from Gutendex API on search', async () => {
    const mockResponse = {
      count: 1,
      results: [
        {
          id: 2600,
          title: 'War and Peace',
          authors: [{ name: 'Tolstoy, Leo' }],
          formats: {
            'text/plain': 'https://www.gutenberg.org/files/2600/2600-0.txt',
          },
        },
      ],
    };

    global.fetch.resolves({
      ok: true,
      json: async () => mockResponse,
    });

    render(<BookSearch onChoose={onChooseSpy} />);
    const input = screen.getByPlaceholderText('Search Project Gutenberg...');
    const button = screen.getByText('Search');

    fireEvent.change(input, { target: { value: 'War and Peace' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch.calledOnce).to.be.true;
      expect(global.fetch.calledWith('https://gutendex.com/books/?search=War%20and%20Peace')).to.be
        .true;
    });
  });

  it('displays search results', async () => {
    const mockResponse = {
      count: 2,
      results: [
        {
          id: 2600,
          title: 'War and Peace',
          authors: [{ name: 'Tolstoy, Leo' }],
          formats: {
            'text/plain': 'https://www.gutenberg.org/files/2600/2600-0.txt',
          },
        },
        {
          id: 1399,
          title: 'Anna Karenina',
          authors: [{ name: 'Tolstoy, Leo' }],
          formats: {
            'text/plain': 'https://www.gutenberg.org/files/1399/1399-0.txt',
          },
        },
      ],
    };

    global.fetch.resolves({
      ok: true,
      json: async () => mockResponse,
    });

    render(<BookSearch onChoose={onChooseSpy} />);
    const input = screen.getByPlaceholderText('Search Project Gutenberg...');
    const button = screen.getByText('Search');

    fireEvent.change(input, { target: { value: 'Tolstoy' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('War and Peace')).to.exist;
      expect(screen.getByText('Anna Karenina')).to.exist;
      expect(screen.getByText('2 books found')).to.exist;
    });
  });

  it('filters out books without text/plain format', async () => {
    const mockResponse = {
      count: 2,
      results: [
        {
          id: 2600,
          title: 'War and Peace',
          authors: [{ name: 'Tolstoy, Leo' }],
          formats: {
            'text/plain': 'https://www.gutenberg.org/files/2600/2600-0.txt',
          },
        },
        {
          id: 1234,
          title: 'Book Without Text',
          authors: [{ name: 'Author' }],
          formats: {
            'application/epub+zip': 'https://example.com/book.epub',
          },
        },
      ],
    };

    global.fetch.resolves({
      ok: true,
      json: async () => mockResponse,
    });

    render(<BookSearch onChoose={onChooseSpy} />);
    const input = screen.getByPlaceholderText('Search Project Gutenberg...');
    const button = screen.getByText('Search');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('War and Peace')).to.exist;
      expect(screen.queryByText('Book Without Text')).to.not.exist;
      expect(screen.getByText('1 book found')).to.exist;
    });
  });

  it('calls onChoose with text URL when book is clicked', async () => {
    const mockResponse = {
      count: 1,
      results: [
        {
          id: 2600,
          title: 'War and Peace',
          authors: [{ name: 'Tolstoy, Leo' }],
          formats: {
            'text/plain': 'https://www.gutenberg.org/files/2600/2600-0.txt',
          },
        },
      ],
    };

    global.fetch.resolves({
      ok: true,
      json: async () => mockResponse,
    });

    render(<BookSearch onChoose={onChooseSpy} />);
    const input = screen.getByPlaceholderText('Search Project Gutenberg...');
    const searchButton = screen.getByText('Search');

    fireEvent.change(input, { target: { value: 'War' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      const bookButton = screen.getByText('War and Peace');
      fireEvent.click(bookButton);

      expect(onChooseSpy.calledOnce).to.be.true;
      expect(onChooseSpy.calledWith('https://www.gutenberg.org/files/2600/2600-0.txt')).to.be.true;
    });
  });

  it('displays error message when fetch fails', async () => {
    global.fetch.rejects(new Error('Network error'));

    render(<BookSearch onChoose={onChooseSpy} />);
    const input = screen.getByPlaceholderText('Search Project Gutenberg...');
    const button = screen.getByText('Search');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Error: Network error/)).to.exist;
    });
  });

  it('displays loading state during search', async () => {
    global.fetch.returns(
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              json: async () => ({ count: 0, results: [] }),
            }),
          100
        )
      )
    );

    render(<BookSearch onChoose={onChooseSpy} />);
    const input = screen.getByPlaceholderText('Search Project Gutenberg...');
    const button = screen.getByText('Search');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(button);

    expect(screen.getByText('Searching...')).to.exist;
    expect(input.disabled).to.be.true;
  });

  it('displays empty state when no results found', async () => {
    const mockResponse = {
      count: 0,
      results: [],
    };

    global.fetch.resolves({
      ok: true,
      json: async () => mockResponse,
    });

    render(<BookSearch onChoose={onChooseSpy} />);
    const input = screen.getByPlaceholderText('Search Project Gutenberg...');
    const button = screen.getByText('Search');

    fireEvent.change(input, { target: { value: 'nonexistent' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/No books with text format found for "nonexistent"/)).to.exist;
    });
  });

  it('formats multiple authors correctly', async () => {
    const mockResponse = {
      count: 1,
      results: [
        {
          id: 1234,
          title: 'Collaborative Book',
          authors: [{ name: 'Author One' }, { name: 'Author Two' }, { name: 'Author Three' }],
          formats: {
            'text/plain': 'https://example.com/book.txt',
          },
        },
      ],
    };

    global.fetch.resolves({
      ok: true,
      json: async () => mockResponse,
    });

    render(<BookSearch onChoose={onChooseSpy} />);
    const input = screen.getByPlaceholderText('Search Project Gutenberg...');
    const button = screen.getByText('Search');

    fireEvent.change(input, { target: { value: 'collaborative' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Author One, Author Two, Author Three')).to.exist;
    });
  });

  it('handles books with no authors', async () => {
    const mockResponse = {
      count: 1,
      results: [
        {
          id: 1234,
          title: 'Anonymous Book',
          authors: [],
          formats: {
            'text/plain': 'https://example.com/book.txt',
          },
        },
      ],
    };

    global.fetch.resolves({
      ok: true,
      json: async () => mockResponse,
    });

    render(<BookSearch onChoose={onChooseSpy} />);
    const input = screen.getByPlaceholderText('Search Project Gutenberg...');
    const button = screen.getByText('Search');

    fireEvent.change(input, { target: { value: 'anonymous' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Unknown Author')).to.exist;
    });
  });
});
