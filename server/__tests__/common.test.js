import apicache from 'apicache';
import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import app from '../index.js';

describe('Common Server Tests', () => {
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

  describe('CORS Configuration', () => {
    it('should have CORS enabled for all endpoints', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const endpoints = ['/health', '/api/books'];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.headers['access-control-allow-origin']).to.exist;
      }
    });

    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app).options('/api/books');

      expect(response.headers['access-control-allow-origin']).to.exist;
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      await request(app).get('/non-existent-route').expect(404);
    });

    it('should return 404 for /api/invalid', async () => {
      await request(app).get('/api/invalid').expect(404);
    });
  });

  describe('Error Response Format', () => {
    it('should return errors in JSON format', async () => {
      fetchStub = sinon.stub(global, 'fetch').rejects(new Error('Test error'));

      const response = await request(app).get('/api/books').expect(500);

      expect(response.body).to.be.an('object');
      expect(response.body).to.have.property('error');
      expect(response.headers['content-type']).to.include('application/json');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long book URLs', async () => {
      const longUrl = `http://example.com/${'a'.repeat(1000)}.txt`;
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        text: async () => 'Content',
      });

      await request(app).get('/api/book-text').query({ url: longUrl }).expect(200);

      expect(fetchStub.firstCall.args[0]).to.equal(longUrl);
    });

    it('should handle special characters in book URLs', async () => {
      const specialUrl = 'http://example.com/book?param=value&other=test';
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        text: async () => 'Content',
      });

      await request(app).get('/api/book-text').query({ url: specialUrl }).expect(200);

      expect(fetchStub.firstCall.args[0]).to.equal(specialUrl);
    });

    it('should handle large book text responses', async () => {
      const largeText = 'A'.repeat(1000000); // 1MB of text
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        text: async () => largeText,
      });

      const response = await request(app)
        .get('/api/book-text')
        .query({ url: 'http://example.com/large.txt' })
        .expect(200);

      expect(response.text).to.equal(largeText);
    });

    it('should handle empty book text response', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        text: async () => '',
      });

      const response = await request(app)
        .get('/api/book-text')
        .query({ url: 'http://example.com/empty.txt' })
        .expect(200);

      expect(response.text).to.equal('');
    });

    it('should handle books API returning empty results', async () => {
      fetchStub = sinon.stub(global, 'fetch').resolves({
        ok: true,
        json: async () => ({ count: 0, results: [] }),
      });

      const response = await request(app).get('/api/books').expect(200);

      expect(response.body.results).to.be.an('array').that.is.empty;
    });
  });
});
