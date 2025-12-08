import { renderHook } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import { MESSAGES } from '../../constants/constants.js';
import useReaderAutoScroll from '../useReaderAutoScroll.js';

describe('useReaderAutoScroll', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('should not send messages when disabled', () => {
    const messages = [];
    const mockWorker = { postMessage: (msg) => messages.push(msg) };

    renderHook(() => useReaderAutoScroll(mockWorker, { enabled: false, time: 60, amount: 2 }));

    clock.tick(1000);
    expect(messages.length).to.equal(0);
  });

  it('should send scroll messages at specified interval when enabled', () => {
    const messages = [];
    const mockWorker = { postMessage: (msg) => messages.push(msg) };

    renderHook(() => useReaderAutoScroll(mockWorker, { enabled: true, time: 100, amount: 5 }));

    clock.tick(100);
    expect(messages.length).to.equal(1);
    clock.tick(100);
    expect(messages.length).to.equal(2);
    clock.tick(100);
    expect(messages.length).to.equal(3);
  });

  it('should send correct message type and scroll amount', () => {
    const messages = [];
    const mockWorker = { postMessage: (msg) => messages.push(msg) };

    renderHook(() => useReaderAutoScroll(mockWorker, { enabled: true, time: 60, amount: 10 }));

    clock.tick(60);
    expect(messages.length).to.equal(1);
    expect(messages[0]).to.deep.equal({
      type: MESSAGES.SCROLL,
      scrollDelta: 10,
    });
  });

  it('should clear interval on unmount', () => {
    const messages = [];
    const mockWorker = { postMessage: (msg) => messages.push(msg) };

    const { unmount } = renderHook(() =>
      useReaderAutoScroll(mockWorker, { enabled: true, time: 100, amount: 2 })
    );

    clock.tick(100);
    expect(messages.length).to.equal(1);

    unmount();
    clock.tick(1000);
    expect(messages.length).to.equal(1);
  });
});
