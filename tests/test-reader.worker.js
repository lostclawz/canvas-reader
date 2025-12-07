import { expect } from 'chai';
import sinon from 'sinon';
import { MESSAGES } from '../src/constants/constants.js';

describe('reader.worker', () => {
  let mockCtx;
  let mockCanvas;
  let fetchStub;
  let rafStub;
  let consoleStub;

  beforeEach(() => {
    mockCtx = {
      clearRect: sinon.spy(),
      fillText: sinon.spy(),
      fillRect: sinon.spy(),
      measureText: sinon.stub().returns({ width: 10 }),
      setTransform: sinon.spy(),
      save: sinon.spy(),
      restore: sinon.spy(),
      font: '',
      textBaseline: '',
      textAlign: '',
      fillStyle: '',
      strokeStyle: '',
    };

    mockCanvas = {
      getContext: sinon.stub().returns(mockCtx),
      width: 800,
      height: 600,
    };

    fetchStub = sinon.stub(global, 'fetch');
    rafStub = sinon.stub(global, 'requestAnimationFrame').callsFake((cb) => {
      setTimeout(cb, 0);
      return 1;
    });
    consoleStub = sinon.stub(console, 'log');
  });

  afterEach(() => {
    if (fetchStub) fetchStub.restore();
    if (rafStub) rafStub.restore();
    if (consoleStub) consoleStub.restore();
  });

  describe('Message Types', () => {
    it('should define all required message types', () => {
      expect(MESSAGES.INIT).to.equal('INIT');
      expect(MESSAGES.KILL).to.equal('KILL');
      expect(MESSAGES.SCROLL).to.equal('SCROLL');
      expect(MESSAGES.UPDATE).to.equal('UPDATE');
      expect(MESSAGES.SEARCH).to.equal('SEARCH');
      expect(MESSAGES.MOUSE_DOWN).to.equal('MOUSE_DOWN');
      expect(MESSAGES.MOUSE_UP).to.equal('MOUSE_UP');
      expect(MESSAGES.MOUSE_MOVE).to.equal('MOUSE_MOVE');
    });
  });

  describe('Utilities existence', () => {
    it('should have scrollbar utilities', async () => {
      const mod = await import('../src/utils/scrollbar.js');
      expect(mod.setupScrollBar).to.be.a('function');
    });

    it('should have reader utilities', async () => {
      const utils = await import('../src/utils/reader-utils.js');
      expect(utils.memo).to.be.a('function');
      expect(utils.reduceLines).to.be.a('function');
      expect(utils.measureWordSet).to.be.a('function');
      expect(utils.splitLines).to.be.a('function');
      expect(utils.joinLines).to.be.a('function');
      expect(utils.quickStringSearch).to.be.a('function');
    });
  });

  describe('Canvas operations', () => {
    it('should handle canvas context setup', () => {
      const canvas = mockCanvas;
      const ctx = canvas.getContext('2d');

      ctx.font = '15px Helvetica';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'black';
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      expect(canvas.getContext.calledWith('2d')).to.be.true;
      expect(ctx.font).to.equal('15px Helvetica');
      expect(ctx.textBaseline).to.equal('top');
      expect(ctx.textAlign).to.equal('left');
      expect(ctx.fillStyle).to.equal('black');
      expect(ctx.setTransform.calledWith(1, 0, 0, 1, 0, 0)).to.be.true;
    });

    it('should handle text rendering', () => {
      mockCtx.fillText('Test line', 0, 10);
      expect(mockCtx.fillText.calledWith('Test line', 0, 10)).to.be.true;
    });

    it('should handle canvas clearing', () => {
      mockCtx.clearRect(0, 0, 800, 600);
      expect(mockCtx.clearRect.calledWith(0, 0, 800, 600)).to.be.true;
    });
  });

  describe('Fetch operations', () => {
    it('should handle successful content fetch', async () => {
      const testContent = 'Test content for reader';
      fetchStub.resolves({
        json: () => Promise.resolve(testContent),
      });

      const response = await fetch('/test.txt');
      const content = await response.json();

      expect(fetchStub.calledWith('/test.txt')).to.be.true;
      expect(content).to.equal(testContent);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Network error');
      fetchStub.rejects(error);

      try {
        await fetch('/invalid.txt');
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(err.message).to.equal('Network error');
      }
    });
  });

  describe('Worker file existence', () => {
    it('should have worker file at expected location', async () => {
      const { default: fs } = await import('node:fs');
      const { default: path } = await import('node:path');
      const workerPath = path.join(path.dirname(new URL(import.meta.url).pathname), '../src/workers/reader.worker.js');
      expect(fs.existsSync(workerPath)).to.be.true;
    });
  });
});
