import { render } from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';
import Reader from '../src/components/ReaderNoStyle.jsx';

global.fetch = global.fetch || (() => Promise.resolve({ json: () => Promise.resolve([]) }));

describe('Reader', () => {
  beforeEach(() => {
    global.Worker = class {
      constructor() {
        this.postMessage = () => {};
        this.terminate = () => {};
      }
    };
  });

  it('should render without crashing', () => {
    const { container } = render(<Reader />);
    expect(container).to.exist;
  });

  it('should render with custom size', () => {
    const { container } = render(<Reader size={1000} />);
    expect(container.querySelector('.reader')).to.exist;
  });

  it('should render with custom fontSize', () => {
    const { container } = render(<Reader fontSize={20} />);
    expect(container.querySelector('.reader')).to.exist;
  });

  it('should render CanvasReader component', () => {
    const { container } = render(<Reader />);
    const canvas = container.querySelector('canvas');
    expect(canvas).to.exist;
  });

  it('should use default size when not provided', () => {
    const { container } = render(<Reader />);
    const canvas = container.querySelector('canvas');
    expect(canvas).to.exist;
    expect(canvas.getAttribute('width')).to.exist;
    expect(canvas.getAttribute('height')).to.exist;
  });

  it('should use default fontSize when not provided', () => {
    const { container } = render(<Reader />);
    expect(container.querySelector('canvas')).to.exist;
  });

  it('should have reader class on container', () => {
    const { container } = render(<Reader />);
    expect(container.querySelector('.reader')).to.exist;
  });
});
