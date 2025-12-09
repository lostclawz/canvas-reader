import apicache from 'apicache';
import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import app from '../index.js';

describe('Health Endpoint', () => {
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

  describe('GET /health', () => {
    it('should return status ok', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).to.deep.equal({ status: 'ok' });
      expect(response.headers['content-type']).to.match(/json/);
    });

    it('should have correct content type', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['content-type']).to.include('application/json');
    });
  });
});
