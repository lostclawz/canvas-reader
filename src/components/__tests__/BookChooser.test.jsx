import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';
import sinon from 'sinon';
import BookChooser from '../BookChooser.jsx';

describe('BookChooser', () => {
  let fetchStub;

  beforeEach(() => {
    fetchStub = sinon.stub(global, 'fetch');
  });

  afterEach(() => {
    cleanup();
    fetchStub.restore();
  });

  it('renders null while loading books', () => {
    fetchStub.resolves({
      json: () => Promise.resolve({ results: [] }),
    });

    const { container } = render(<BookChooser onSelect={() => {}} />);
    expect(container.firstChild).to.be.null;
  });

  it('fetches books from the API on mount', async () => {
    const mockBooks = {
      results: [
        { id: 1, title: 'Book One' },
        { id: 2, title: 'Book Two' },
      ],
    };

    fetchStub.resolves({
      json: () => Promise.resolve(mockBooks),
    });

    render(<BookChooser onSelect={() => {}} />);

    await waitFor(() => {
      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.firstCall.args[0]).to.include('/api/books');
    });
  });

  it('renders a select element with books after loading', async () => {
    const mockBooks = {
      results: [
        { id: 1, title: 'Book One' },
        { id: 2, title: 'Book Two' },
        { id: 3, title: 'Book Three' },
      ],
    };

    fetchStub.resolves({
      json: () => Promise.resolve(mockBooks),
    });

    const { container } = render(<BookChooser onSelect={() => {}} />);

    await waitFor(() => {
      const select = container.querySelector('select');
      expect(select).to.exist;
      expect(select.className).to.equal('book-chooser');
    });
  });

  it('renders all books as options', async () => {
    const mockBooks = {
      results: [
        { id: 1, title: 'Book One' },
        { id: 2, title: 'Book Two' },
        { id: 3, title: 'Book Three' },
      ],
    };

    fetchStub.resolves({
      json: () => Promise.resolve(mockBooks),
    });

    const { container } = render(<BookChooser onSelect={() => {}} />);

    await waitFor(() => {
      const options = container.querySelectorAll('option');
      expect(options.length).to.equal(3);
      expect(options[0].textContent).to.equal('Book One');
      expect(options[0].value).to.equal('1');
      expect(options[1].textContent).to.equal('Book Two');
      expect(options[1].value).to.equal('2');
      expect(options[2].textContent).to.equal('Book Three');
      expect(options[2].value).to.equal('3');
    });
  });

  it('sets size attribute to minimum of book count or 10', async () => {
    const mockBooks = {
      results: [
        { id: 1, title: 'Book One' },
        { id: 2, title: 'Book Two' },
        { id: 3, title: 'Book Three' },
      ],
    };

    fetchStub.resolves({
      json: () => Promise.resolve(mockBooks),
    });

    const { container } = render(<BookChooser onSelect={() => {}} />);

    await waitFor(() => {
      const select = container.querySelector('select');
      expect(select.size).to.equal(3);
    });
  });

  it('sets size attribute to 10 when there are more than 10 books', async () => {
    const mockBooks = {
      results: Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        title: `Book ${i + 1}`,
      })),
    };

    fetchStub.resolves({
      json: () => Promise.resolve(mockBooks),
    });

    const { container } = render(<BookChooser onSelect={() => {}} />);

    await waitFor(() => {
      const select = container.querySelector('select');
      expect(select.size).to.equal(10);
    });
  });

  it('calls onSelect with the selected book when an option is clicked', async () => {
    const mockBooks = {
      results: [
        { id: 1, title: 'Book One', author: 'Author One' },
        { id: 2, title: 'Book Two', author: 'Author Two' },
      ],
    };

    fetchStub.resolves({
      json: () => Promise.resolve(mockBooks),
    });

    const onSelectSpy = sinon.spy();
    const { container } = render(<BookChooser onSelect={onSelectSpy} />);

    await waitFor(() => {
      const select = container.querySelector('select');
      expect(select).to.exist;
    });

    const select = container.querySelector('select');
    fireEvent.change(select, { target: { value: '2' } });

    expect(onSelectSpy.calledOnce).to.be.true;
    expect(onSelectSpy.firstCall.args[0]).to.deep.equal({
      id: 2,
      title: 'Book Two',
      author: 'Author Two',
    });
  });

  it('handles string IDs correctly', async () => {
    const mockBooks = {
      results: [
        { id: 'book-1', title: 'Book One' },
        { id: 'book-2', title: 'Book Two' },
      ],
    };

    fetchStub.resolves({
      json: () => Promise.resolve(mockBooks),
    });

    const onSelectSpy = sinon.spy();
    const { container } = render(<BookChooser onSelect={onSelectSpy} />);

    await waitFor(() => {
      const select = container.querySelector('select');
      expect(select).to.exist;
    });

    const select = container.querySelector('select');
    fireEvent.change(select, { target: { value: 'book-2' } });

    expect(onSelectSpy.calledOnce).to.be.true;
    expect(onSelectSpy.firstCall.args[0]).to.deep.equal({
      id: 'book-2',
      title: 'Book Two',
    });
  });

  it('does not call onSelect if selected book is not found', async () => {
    const mockBooks = {
      results: [
        { id: 1, title: 'Book One' },
        { id: 2, title: 'Book Two' },
      ],
    };

    fetchStub.resolves({
      json: () => Promise.resolve(mockBooks),
    });

    const onSelectSpy = sinon.spy();
    const { container } = render(<BookChooser onSelect={onSelectSpy} />);

    await waitFor(() => {
      const select = container.querySelector('select');
      expect(select).to.exist;
    });

    const select = container.querySelector('select');
    fireEvent.change(select, { target: { value: '999' } });

    expect(onSelectSpy.called).to.be.false;
  });

  it('handles empty book list', async () => {
    const mockBooks = {
      results: [],
    };

    fetchStub.resolves({
      json: () => Promise.resolve(mockBooks),
    });

    const { container } = render(<BookChooser onSelect={() => {}} />);

    await waitFor(() => {
      const select = container.querySelector('select');
      expect(select).to.exist;
      expect(select.size).to.equal(0);
    });

    const options = container.querySelectorAll('option');
    expect(options.length).to.equal(0);
  });

  it('handles single book', async () => {
    const mockBooks = {
      results: [{ id: 1, title: 'Only Book' }],
    };

    fetchStub.resolves({
      json: () => Promise.resolve(mockBooks),
    });

    const { container } = render(<BookChooser onSelect={() => {}} />);

    await waitFor(() => {
      const select = container.querySelector('select');
      expect(select).to.exist;
      expect(select.size).to.equal(1);
    });

    const options = container.querySelectorAll('option');
    expect(options.length).to.equal(1);
    expect(options[0].textContent).to.equal('Only Book');
  });

  it('renders books with all optional properties', async () => {
    const mockBooks = {
      results: [
        {
          id: 1,
          title: 'Complete Book',
          author: 'Test Author',
          file: '/books/test.epub',
        },
      ],
    };

    fetchStub.resolves({
      json: () => Promise.resolve(mockBooks),
    });

    const onSelectSpy = sinon.spy();
    const { container } = render(<BookChooser onSelect={onSelectSpy} />);

    await waitFor(() => {
      const select = container.querySelector('select');
      expect(select).to.exist;
    });

    const select = container.querySelector('select');
    fireEvent.change(select, { target: { value: '1' } });

    expect(onSelectSpy.calledOnce).to.be.true;
    expect(onSelectSpy.firstCall.args[0]).to.deep.equal({
      id: 1,
      title: 'Complete Book',
      author: 'Test Author',
      file: '/books/test.epub',
    });
  });

  it('correctly uses HOST and NODE_SERVER_PORT constants in fetch URL', async () => {
    const mockBooks = {
      results: [{ id: 1, title: 'Book' }],
    };

    fetchStub.resolves({
      json: () => Promise.resolve(mockBooks),
    });

    render(<BookChooser onSelect={() => {}} />);

    await waitFor(() => {
      expect(fetchStub.calledOnce).to.be.true;
      const url = fetchStub.firstCall.args[0];
      expect(url).to.match(/^http:\/\/.+:\d+\/api\/books$/);
    });
  });
});
