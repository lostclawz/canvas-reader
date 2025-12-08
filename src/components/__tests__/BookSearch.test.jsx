import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';
import sinon from 'sinon';
import BookSearch from '../BookSearch.jsx';

describe('BookSearch', () => {
  let fetchStub;

  beforeEach(() => {
    fetchStub = sinon.stub(global, 'fetch');
  });

  afterEach(() => {
    cleanup();
    fetchStub.restore();
  });

  it('renders search form with input and button', () => {
    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const button = container.querySelector('button[type="submit"]');

    expect(input).to.exist;
    expect(button).to.exist;
    expect(input.placeholder).to.equal('Search Project Gutenberg...');
  });

  it('disables submit button when search text is empty', () => {
    const { container } = render(<BookSearch onChoose={() => {}} />);

    const button = container.querySelector('button[type="submit"]');
    expect(button.disabled).to.be.true;
  });

  it('enables submit button when search text is entered', () => {
    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const button = container.querySelector('button[type="submit"]');

    fireEvent.change(input, { target: { value: 'alice' } });

    expect(button.disabled).to.be.false;
  });

  it('updates search text state when input changes', () => {
    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    fireEvent.change(input, { target: { value: 'sherlock' } });

    expect(input.value).to.equal('sherlock');
  });

  it('fetches search results from server API on form submit', async () => {
    const mockResults = {
      count: 1,
      results: [
        {
          id: 11,
          title: "Alice's Adventures in Wonderland",
          authors: [{ name: 'Lewis Carroll' }],
          formats: { 'text/plain': 'http://example.com/alice.txt' },
        },
      ],
    };

    fetchStub.resolves({
      ok: true,
      json: async () => mockResults,
    });

    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    fireEvent.change(input, { target: { value: 'alice' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetchStub.calledOnce).to.be.true;
      const url = fetchStub.firstCall.args[0];
      expect(url).to.include('/api/search');
      expect(url).to.include('q=alice');
    });
  });

  it('displays search results after successful search', async () => {
    const mockResults = {
      count: 2,
      results: [
        {
          id: 11,
          title: "Alice's Adventures in Wonderland",
          authors: [{ name: 'Lewis Carroll' }],
          formats: { 'text/plain': 'http://example.com/alice.txt' },
        },
        {
          id: 12,
          title: 'Through the Looking-Glass',
          authors: [{ name: 'Lewis Carroll' }],
          formats: { 'text/plain': 'http://example.com/looking-glass.txt' },
        },
      ],
    };

    fetchStub.resolves({
      ok: true,
      json: async () => mockResults,
    });

    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    fireEvent.change(input, { target: { value: 'alice' } });
    fireEvent.submit(form);

    await waitFor(() => {
      const results = container.querySelectorAll('.book-search-item');
      expect(results.length).to.equal(2);
    });

    expect(screen.getByText("Alice's Adventures in Wonderland")).to.exist;
    expect(screen.getByText('Through the Looking-Glass')).to.exist;
  });

  it('filters out books without text/plain format', async () => {
    const mockResults = {
      count: 3,
      results: [
        {
          id: 11,
          title: 'Book with text',
          authors: [{ name: 'Author One' }],
          formats: { 'text/plain': 'http://example.com/book1.txt' },
        },
        {
          id: 12,
          title: 'Book without text',
          authors: [{ name: 'Author Two' }],
          formats: { 'text/html': 'http://example.com/book2.html' },
        },
        {
          id: 13,
          title: 'Another book with text',
          authors: [{ name: 'Author Three' }],
          formats: { 'text/plain': 'http://example.com/book3.txt' },
        },
      ],
    };

    fetchStub.resolves({
      ok: true,
      json: async () => mockResults,
    });

    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(form);

    await waitFor(() => {
      const results = container.querySelectorAll('.book-search-item');
      expect(results.length).to.equal(2);
    });

    expect(screen.getByText('Book with text')).to.exist;
    expect(screen.getByText('Another book with text')).to.exist;
    expect(screen.queryByText('Book without text')).to.not.exist;
  });

  it('displays correct count message for results', async () => {
    const mockResults = {
      count: 2,
      results: [
        {
          id: 1,
          title: 'Book One',
          authors: [{ name: 'Author' }],
          formats: { 'text/plain': 'http://example.com/book1.txt' },
        },
        {
          id: 2,
          title: 'Book Two',
          authors: [{ name: 'Author' }],
          formats: { 'text/plain': 'http://example.com/book2.txt' },
        },
      ],
    };

    fetchStub.resolves({
      ok: true,
      json: async () => mockResults,
    });

    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('2 books found')).to.exist;
    });
  });

  it('displays singular "book" for single result', async () => {
    const mockResults = {
      count: 1,
      results: [
        {
          id: 1,
          title: 'Single Book',
          authors: [{ name: 'Author' }],
          formats: { 'text/plain': 'http://example.com/book.txt' },
        },
      ],
    };

    fetchStub.resolves({
      ok: true,
      json: async () => mockResults,
    });

    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('1 book found')).to.exist;
    });
  });

  it('displays empty state when no results found', async () => {
    const mockResults = {
      count: 0,
      results: [],
    };

    fetchStub.resolves({
      ok: true,
      json: async () => mockResults,
    });

    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    fireEvent.change(input, { target: { value: 'nonexistent' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('No books with text format found for "nonexistent"')).to.exist;
    });
  });

  it('displays loading state while searching', async () => {
    fetchStub.returns(new Promise(() => {})); // Never resolves

    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');
    const button = container.querySelector('button[type="submit"]');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(button.textContent).to.equal('Searching...');
      expect(button.disabled).to.be.true;
      expect(input.disabled).to.be.true;
    });
  });

  it('displays error message when fetch fails', async () => {
    fetchStub.resolves({
      ok: false,
      status: 500,
    });

    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).to.exist;
    });
  });

  it('displays error message on network error', async () => {
    fetchStub.rejects(new Error('Network error'));

    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).to.exist;
    });
  });

  it('calls onChoose with text URL when book is selected', async () => {
    const mockResults = {
      count: 1,
      results: [
        {
          id: 11,
          title: "Alice's Adventures in Wonderland",
          authors: [{ name: 'Lewis Carroll' }],
          formats: { 'text/plain': 'http://example.com/alice.txt' },
        },
      ],
    };

    fetchStub.resolves({
      ok: true,
      json: async () => mockResults,
    });

    const onChooseSpy = sinon.spy();
    const { container } = render(<BookSearch onChoose={onChooseSpy} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    fireEvent.change(input, { target: { value: 'alice' } });
    fireEvent.submit(form);

    await waitFor(() => {
      const bookButton = container.querySelector('.book-search-button');
      expect(bookButton).to.exist;
    });

    const bookButton = container.querySelector('.book-search-button');
    fireEvent.click(bookButton);

    expect(onChooseSpy.calledOnce).to.be.true;
    expect(onChooseSpy.firstCall.args[0]).to.equal('http://example.com/alice.txt');
  });

  it('formats author names correctly', async () => {
    const mockResults = {
      count: 1,
      results: [
        {
          id: 1,
          title: 'Test Book',
          authors: [{ name: 'Author One' }, { name: 'Author Two' }],
          formats: { 'text/plain': 'http://example.com/book.txt' },
        },
      ],
    };

    fetchStub.resolves({
      ok: true,
      json: async () => mockResults,
    });

    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Author One, Author Two')).to.exist;
    });
  });

  it('displays "Unknown Author" when no authors provided', async () => {
    const mockResults = {
      count: 1,
      results: [
        {
          id: 1,
          title: 'Test Book',
          authors: [],
          formats: { 'text/plain': 'http://example.com/book.txt' },
        },
      ],
    };

    fetchStub.resolves({
      ok: true,
      json: async () => mockResults,
    });

    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Unknown Author')).to.exist;
    });
  });

  it('encodes search query in URL', async () => {
    fetchStub.resolves({
      ok: true,
      json: async () => ({ count: 0, results: [] }),
    });

    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    fireEvent.change(input, { target: { value: 'alice & bob' } });
    fireEvent.submit(form);

    await waitFor(() => {
      const url = fetchStub.firstCall.args[0];
      expect(url).to.include('q=alice%20%26%20bob');
    });
  });

  it('does not submit search when text is only whitespace', () => {
    fetchStub.resolves({
      ok: true,
      json: async () => ({ count: 0, results: [] }),
    });

    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(form);

    expect(fetchStub.called).to.be.false;
  });

  it('correctly uses HOST and NODE_SERVER_PORT constants in fetch URL', async () => {
    fetchStub.resolves({
      ok: true,
      json: async () => ({ count: 0, results: [] }),
    });

    const { container } = render(<BookSearch onChoose={() => {}} />);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetchStub.calledOnce).to.be.true;
      const url = fetchStub.firstCall.args[0];
      expect(url).to.match(/^http:\/\/.+:\d+\/api\/search\?q=test$/);
    });
  });
});
