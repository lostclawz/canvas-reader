import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';
import sinon from 'sinon';
import { CanvasReader } from '../src/components/CanvasReader.jsx';
import { MESSAGES } from '../src/constants/constants.js';

describe('CanvasReader', () => {
  let mockWorker;
  let workerPostMessageSpy;
  let workerTerminateSpy;
  let transferControlToOffscreenStub;
  let mockOffscreenCanvas;
  let createElementStub;

  beforeEach(() => {
    workerPostMessageSpy = sinon.spy();
    workerTerminateSpy = sinon.spy();
    mockWorker = {
      postMessage: workerPostMessageSpy,
      terminate: workerTerminateSpy,
    };

    global.Worker = sinon.stub().returns(mockWorker);

    mockOffscreenCanvas = { type: 'OffscreenCanvas' };
    transferControlToOffscreenStub = sinon.stub().returns(mockOffscreenCanvas);

    const originalCreateElement = document.createElement.bind(document);
    createElementStub = sinon
      .stub(document, 'createElement')
      .callsFake((tagName) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'canvas') {
          element.transferControlToOffscreen = transferControlToOffscreenStub;
          element.getContext = sinon.stub().returns({
            fillRect: sinon.spy(),
            clearRect: sinon.spy(),
          });
        }
        return element;
      });
  });

  afterEach(() => {
    cleanup();
    createElementStub?.restore?.();
    delete global.Worker;
  });

  it('renders a canvas element', () => {
    const { container } = render(<CanvasReader />);
    const canvas = container.querySelector('canvas');
    expect(canvas).to.exist;
  });

  it('sets canvas dimensions from props', () => {
    const { container } = render(
      <CanvasReader canvasWidth={1000} canvasHeight={600} />
    );
    const canvas = container.querySelector('canvas');
    expect(canvas.width).to.equal(1000);
    expect(canvas.height).to.equal(600);
  });

  it('creates a worker on mount', () => {
    render(<CanvasReader />);
    expect(global.Worker.calledOnce).to.be.true;
  });

  it('terminates worker on unmount', () => {
    const { unmount } = render(<CanvasReader />);
    unmount();
    expect(workerTerminateSpy.calledOnce).to.be.true;
    expect(workerPostMessageSpy.calledWith({ type: 'kill' })).to.be.true;
  });

  it('sends UPDATE when font props change', async () => {
    const { rerender } = render(<CanvasReader size={10} fillStyle="black" />);
    rerender(<CanvasReader size={20} fillStyle="black" />);
    await waitFor(() => {
      const updateCalls = workerPostMessageSpy
        .getCalls()
        .filter((call) => call.args[0]?.type === MESSAGES.UPDATE);
      expect(updateCalls.length).to.be.greaterThan(0);
    });
  });

  it('sends SEARCH when searchText changes', async () => {
    const { rerender } = render(<CanvasReader searchText="" />);
    rerender(<CanvasReader searchText="test query" />);
    await waitFor(() => {
      const searchCall = workerPostMessageSpy
        .getCalls()
        .find((call) => call.args[0]?.searchText === 'test query');
      expect(searchCall).to.exist;
      expect(searchCall.args[0].type).to.equal(MESSAGES.SEARCH);
    });
  });

  it('sends SCROLL on wheel', () => {
    const { container } = render(<CanvasReader />);
    const canvas = container.querySelector('canvas');
    fireEvent.wheel(canvas, { deltaY: 100 });
    const scrollCall = workerPostMessageSpy
      .getCalls()
      .find((call) => call.args[0]?.type === MESSAGES.SCROLL);
    expect(scrollCall).to.exist;
    expect(scrollCall.args[0].scrollDelta).to.equal(100);
  });

  it('sends mouse messages', () => {
    const { container } = render(<CanvasReader />);
    const canvas = container.querySelector('canvas');
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 200, button: 0 });
    fireEvent.mouseUp(canvas, { clientX: 100, clientY: 200, button: 0 });
    fireEvent.mouseMove(canvas, { clientX: 150, clientY: 250, movementY: 10 });
    const md = workerPostMessageSpy.getCalls().find((c) => c.args[0]?.type === MESSAGES.MOUSE_DOWN);
    const mu = workerPostMessageSpy.getCalls().find((c) => c.args[0]?.type === MESSAGES.MOUSE_UP);
    const mm = workerPostMessageSpy.getCalls().find((c) => c.args[0]?.type === MESSAGES.MOUSE_MOVE);
    expect(md).to.exist;
    expect(mu).to.exist;
    expect(mm).to.exist;
  });

  it('defaults: size, canvas dims, route', async () => {
    const { container } = render(<CanvasReader />);
    const canvas = container.querySelector('canvas');
    expect(canvas.width).to.equal(1200);
    expect(canvas.height).to.equal(800);
    await waitFor(() => {
      const updateCall = workerPostMessageSpy
        .getCalls()
        .find((call) => call.args[0]?.type === MESSAGES.UPDATE);
      if (updateCall) expect(updateCall.args[0].size).to.equal(10);
      const initCall = workerPostMessageSpy
        .getCalls()
        .find((call) => call.args[0]?.type === MESSAGES.INIT);
      if (initCall) expect(initCall.args[0].route).to.equal('/books');
    });
  });
});
