import apicache from 'apicache';
import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import app from '../index.js';

describe('Search Endpoint', () => {
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

  describe('GET /api/search', () => {
    it('should return 400 if q parameter is missing', async () => {
      const response = await request(app).get('/api/search').expect(400);

      expect(response.body).to.deep.equal({ error: 'Query parameter "q" is required' });
    });

    it('should fetch and return search results from Gutendex API', async () => {
      const mockSearchResults = {
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: 11,
            title: "Alice's Adventures in Wonderland",
            authors: [{ name: 'Lewis Carroll' }],
            formats: { 'text/plain; charset=us-ascii': 'http://example.com/alice.txt' },
          },
          {
            id: 12,
            title: 'Through the Looking-Glass',
            authors: [{ name: 'Lewis Carroll' }],
            formats: { 'text/plain; charset=us-ascii': 'http://example.com/looking-glass.txt' },
          },
        ],
      };

      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        json: async () => mockSearchResults,
      });

      const response = await request(app).get('/api/search').query({ q: 'alice' }).expect(200);

      expect(response.body).to.deep.equal(mockSearchResults);
      expect(fetchStub.calledOnce).to.be.true;
      expect(fetchStub.firstCall.args[0]).to.include('https://gutendex.com/books?search=alice');
    });

    it('should encode special characters in search query', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        json: async () => ({ count: 0, results: [] }),
      });

      await request(app).get('/api/search').query({ q: 'alice & bob' }).expect(200);

      expect(fetchStub.calledOnce).to.be.true;
      const url = fetchStub.firstCall.args[0];
      expect(url).to.include('search=alice+%26+bob');
    });

    it('should support pagination with page parameter', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        json: async () => ({ count: 0, results: [] }),
      });

      await request(app).get('/api/search').query({ q: 'test', page: 2 }).expect(200);

      expect(fetchStub.calledOnce).to.be.true;
      const url = fetchStub.firstCall.args[0];
      expect(url).to.include('search=test');
      expect(url).to.include('page=2');
    });

    it('should handle fetch errors gracefully', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: false,
        statusText: 'Not Found',
      });

      const response = await request(app).get('/api/search').query({ q: 'test' }).expect(500);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('Failed to search books');
    });

    it('should handle network errors', async () => {
      fetchStub = sinon.stub(global, 'fetch').rejects(new Error('Network error'));

      const response = await request(app).get('/api/search').query({ q: 'test' }).expect(500);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.equal('Network error');
    });

    it('should log search query', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        json: async () => ({ count: 0, results: [] }),
      });

      await request(app).get('/api/search').query({ q: 'sherlock' });

      expect(consoleLogStub.calledWith('Searching Gutendex for: "sherlock"')).to.be.true;
    });

    it('should log search query with page number', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        json: async () => ({ count: 0, results: [] }),
      });

      await request(app).get('/api/search').query({ q: 'test', page: 3 });

      expect(consoleLogStub.calledWith('Searching Gutendex for: "test" (page 3)')).to.be.true;
    });

    it('should log errors when search fails', async () => {
      const error = new Error('Search failed');
      fetchStub = sinon.stub(global, 'fetch').rejects(error);

      await request(app).get('/api/search').query({ q: 'test' });

      expect(consoleErrorStub.calledWith('Error searching books:', error)).to.be.true;
    });

    it('should handle empty search query parameter', async () => {
      const response = await request(app).get('/api/search').query({ q: '' }).expect(400);

      expect(response.body).to.deep.equal({ error: 'Query parameter "q" is required' });
    });

    it('should return empty results when no books match', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        json: async () => ({ count: 0, results: [] }),
      });

      const response = await request(app)
        .get('/api/search')
        .query({ q: 'nonexistentbook123' })
        .expect(200);

      expect(response.body.count).to.equal(0);
      expect(response.body.results).to.be.an('array').that.is.empty;
    });

    it('should have CORS headers', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        json: async () => ({ count: 0, results: [] }),
      });

      const response = await request(app).get('/api/search').query({ q: 'test' });

      expect(response.headers['access-control-allow-origin']).to.exist;
    });
  });
});
