import apicache from 'apicache';
import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import app from '../index.js';

describe('Cache Management', () => {
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
    consoleLogStub.restore();
    consoleErrorStub.restore();
  });

  describe('GET /api/cache/stats', () => {
    it('should return cache performance statistics', async () => {
      const response = await request(app).get('/api/cache/stats').expect(200);

      // apicache.getPerformance() returns an array
      expect(response.body).to.satisfy((body) => Array.isArray(body) || typeof body === 'object');
      expect(response.headers['content-type']).to.include('application/json');
    });

    it('should have CORS headers', async () => {
      const response = await request(app).get('/api/cache/stats');

      expect(response.headers['access-control-allow-origin']).to.exist;
    });
  });

  describe('GET /api/cache/index', () => {
    it('should return cache index', async () => {
      const response = await request(app).get('/api/cache/index').expect(200);

      expect(response.body).to.be.an('object');
      expect(response.headers['content-type']).to.include('application/json');
    });

    it('should have CORS headers', async () => {
      const response = await request(app).get('/api/cache/index');

      expect(response.headers['access-control-allow-origin']).to.exist;
    });
  });

  describe('DELETE /api/cache', () => {
    it('should clear the cache', async () => {
      const response = await request(app).delete('/api/cache').expect(200);

      expect(response.body).to.deep.equal({ message: 'Cache cleared' });
      expect(response.headers['content-type']).to.include('application/json');
    });

    it('should log cache clear message', async () => {
      await request(app).delete('/api/cache');

      expect(consoleLogStub.calledWith('Cache cleared')).to.be.true;
    });

    it('should have CORS headers', async () => {
      const response = await request(app).delete('/api/cache');

      expect(response.headers['access-control-allow-origin']).to.exist;
    });
  });
});
