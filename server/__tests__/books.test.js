import apicache from 'apicache';
import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import app from '../index.js';

describe('Books Endpoints', () => {
  let fetchStub;
  let consoleLogStub;
  let consoleErrorStub;

  beforeEach(() => {
    // Clear the API cache before each test to prevent test interference
    apicache.clear();

    // Stub console methods to reduce test noise
    consoleLogStub = sinon.stub(console, 'log');
    consoleErrorStub = sinon.stub(console, 'error');
  });

  afterEach(() => {
    // Restore all stubs
    if (fetchStub) {
      fetchStub.restore();
    }
    consoleLogStub.restore();
    consoleErrorStub.restore();
  });

  describe('GET /api/books', () => {
    it('should fetch and return books from Gutendex API', async () => {
      const mockBooksData = {
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            title: 'Test Book 1',
            authors: [{ name: 'Test Author 1' }],
            formats: { 'text/plain; charset=us-ascii': 'http://example.com/book1.txt' },
          },
          {
            id: 2,
            title: 'Test Book 2',
            authors: [{ name: 'Test Author 2' }],
            formats: { 'text/plain; charset=us-ascii': 'http://example.com/book2.txt' },
          },
        ],
      };

      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        json: async () => mockBooksData,
      });

      const response = await request(app).get('/api/books').expect(200);

      expect(response.body).to.deep.equal(mockBooksData);
      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.firstCall.args[0]).to.equal('https://gutendex.com/books');
    });

    it('should handle fetch errors gracefully', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: false,
        statusText: 'Not Found',
      });

      const response = await request(app).get('/api/books').expect(500);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('Failed to fetch books');
    });

    it('should handle network errors', async () => {
      fetchStub = sinon.stub(global, 'fetch').rejects(new Error('Network error'));

      const response = await request(app).get('/api/books').expect(500);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.equal('Network error');
    });

    it('should log fetching message', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await request(app).get('/api/books');

      expect(consoleLogStub.calledWith('Fetching books from Gutendex...')).to.be.true;
    });

    it('should log errors when fetch fails', async () => {
      const error = new Error('Test error');
      fetchStub = sinon.stub(global, 'fetch').rejects(error);

      await request(app).get('/api/books');

      expect(consoleErrorStub.calledWith('Error fetching books:', error)).to.be.true;
    });

    it('should have CORS headers', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const response = await request(app).get('/api/books');

      expect(response.headers['access-control-allow-origin']).to.exist;
    });
  });

  describe('GET /api/book-text', () => {
    it('should return 400 if url parameter is missing', async () => {
      const response = await request(app).get('/api/book-text').expect(400);

      expect(response.body).to.deep.equal({ error: 'URL parameter is required' });
    });

    it('should fetch and return book text content', async () => {
      const mockBookText = 'This is the content of the book.\nChapter 1\nOnce upon a time...';
      const bookUrl = 'http://example.com/book.txt';

      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        text: async () => mockBookText,
      });

      const response = await request(app).get('/api/book-text').query({ url: bookUrl }).expect(200);

      expect(response.text).to.equal(mockBookText);
      expect(response.headers['content-type']).to.include('text/plain');
      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.firstCall.args[0]).to.equal(bookUrl);
    });

    it('should handle encoded URLs correctly', async () => {
      const bookUrl = 'http://example.com/book with spaces.txt';
      const encodedUrl = encodeURIComponent(bookUrl);

      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        text: async () => 'Book content',
      });

      await request(app).get(`/api/book-text?url=${encodedUrl}`).expect(200);

      expect(fetchStub.firstCall.args[0]).to.equal(bookUrl);
    });

    it('should handle fetch errors for book text', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: false,
        statusText: 'Not Found',
      });

      const response = await request(app)
        .get('/api/book-text')
        .query({ url: 'http://example.com/missing.txt' })
        .expect(500);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('Failed to fetch');
    });

    it('should handle network errors for book text', async () => {
      fetchStub = sinon.stub(global, 'fetch').rejects(new Error('Connection timeout'));

      const response = await request(app)
        .get('/api/book-text')
        .query({ url: 'http://example.com/book.txt' })
        .expect(500);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.equal('Connection timeout');
    });

    it('should log the book URL being fetched', async () => {
      const bookUrl = 'http://example.com/test.txt';
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        text: async () => 'Content',
      });

      await request(app).get('/api/book-text').query({ url: bookUrl });

      expect(consoleLogStub.calledWith(`Fetching book from: ${bookUrl}`)).to.be.true;
    });

    it('should log errors when book text fetch fails', async () => {
      const error = new Error('Fetch failed');
      fetchStub = sinon.stub(global, 'fetch').rejects(error);

      await request(app).get('/api/book-text').query({ url: 'http://example.com/book.txt' });

      expect(consoleErrorStub.calledWith('Error fetching book:', error)).to.be.true;
    });

    it('should handle empty url parameter', async () => {
      const response = await request(app).get('/api/book-text').query({ url: '' }).expect(400);

      expect(response.body).to.deep.equal({ error: 'URL parameter is required' });
    });

    it('should have correct content-type for text response', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        text: async () => 'Book content',
      });

      const response = await request(app)
        .get('/api/book-text')
        .query({ url: 'http://example.com/book.txt' });

      expect(response.headers['content-type']).to.include('text/plain');
    });
  });
});
