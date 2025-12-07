import { expect } from 'chai';
import { LINE_BREAK } from '../src/constants/constants.js';
import {
  joinLines,
  lineSpacer,
  measureWordSet,
  memo,
  quickStringSearch,
  reduceLines,
  splitLines,
  stopMouseEvents,
} from '../src/utils/reader-utils.js';

describe('reader-utils', () => {
  describe('memo', () => {
    it('should memoize function results', () => {
      let callCount = 0;
      const expensiveFn = memo((x) => {
        callCount++;
        return x * 2;
      });

      expect(expensiveFn(5)).to.equal(10);
      expect(callCount).to.equal(1);

      expect(expensiveFn(5)).to.equal(10);
      expect(callCount).to.equal(1);

      expect(expensiveFn(10)).to.equal(20);
      expect(callCount).to.equal(2);
    });
  });

  describe('lineSpacer', () => {
    it('should intersperse LINE_BREAK between array elements', () => {
      const result = lineSpacer(['line1', 'line2', 'line3']);
      expect(result).to.deep.equal([
        'line1',
        LINE_BREAK,
        'line2',
        LINE_BREAK,
        'line3',
      ]);
    });

    it('should handle empty array', () => {
      const result = lineSpacer([]);
      expect(result).to.deep.equal([]);
    });

    it('should handle single element array', () => {
      const result = lineSpacer(['single']);
      expect(result).to.deep.equal(['single']);
    });
  });

  describe('splitLines', () => {
    it('should split text by LINE_BREAK', () => {
      const text = `line1${LINE_BREAK}line2${LINE_BREAK}line3`;
      const result = splitLines(text);
      expect(result).to.deep.equal(['line1', 'line2', 'line3']);
    });

    it('should handle text without line breaks', () => {
      const result = splitLines('single line');
      expect(result).to.deep.equal(['single line']);
    });

    it('should handle empty string', () => {
      const result = splitLines('');
      expect(result).to.deep.equal(['']);
    });
  });

  describe('joinLines', () => {
    it('should join array with LINE_BREAK', () => {
      const result = joinLines(['line1', 'line2', 'line3']);
      expect(result).to.equal(`line1${LINE_BREAK}line2${LINE_BREAK}line3`);
    });

    it('should handle single element', () => {
      const result = joinLines(['single']);
      expect(result).to.equal('single');
    });

    it('should handle empty array', () => {
      const result = joinLines([]);
      expect(result).to.equal('');
    });
  });

  describe('measureWordSet', () => {
    it('should measure text width using context', () => {
      const mockContext = {
        measureText: (text) => ({ width: text.length * 10 }),
      };

      const measure = measureWordSet(mockContext);
      const width = measure(['hello', 'world']);

      expect(width).to.equal(110);
    });

    it('should handle single word', () => {
      const mockContext = {
        measureText: (text) => ({ width: text.length * 10 }),
      };

      const measure = measureWordSet(mockContext);
      const width = measure(['hello']);

      expect(width).to.equal(50);
    });

    it('should handle empty array', () => {
      const mockContext = {
        measureText: (text) => ({ width: text.length * 10 }),
      };

      const measure = measureWordSet(mockContext);
      const width = measure([]);

      expect(width).to.equal(0);
    });
  });

  describe('reduceLines', () => {
    it('should break text into lines that fit maxWidth', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 100;
      const text =
        'This is a test sentence that should be broken into multiple lines';

      const result = reduceLines(measureFn, maxWidth, text);

      expect(result).to.be.an('array');
      result.forEach((line) => {
        expect(measureFn([line])).to.be.at.most(maxWidth);
      });
    });

    it('should preserve line breaks in original text', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 1000;
      const text = 'Line one\nLine two\nLine three';

      const result = reduceLines(measureFn, maxWidth, text);

      expect(result.length).to.be.at.least(3);
    });

    it('should handle single word per line if word is too long', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 50;
      const text = 'superlongword anotherword';

      const result = reduceLines(measureFn, maxWidth, text);

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
    });

    it('should handle empty text', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 100;

      const result = reduceLines(measureFn, maxWidth, '');

      expect(result).to.deep.equal(['']);
    });
  });

  describe('quickStringSearch', () => {
    const testList = [
      'The quick brown fox',
      'jumps over the lazy dog',
      'Lorem ipsum dolor sit amet',
      'Quick test of search',
      'UPPERCASE TEXT',
    ];

    it('should find matching lines case-insensitively', () => {
      const search = quickStringSearch(testList);
      const result = search('quick');

      expect(result).to.have.property('searchText', 'quick');
      expect(result).to.have.property('total', 2);
      expect(result.results).to.be.an('array');
    });

    it('should return all lines when search is empty', () => {
      const search = quickStringSearch(testList);
      const result = search('');

      expect(result).to.deep.equal(testList);
    });

    it('should return empty results for non-matching search', () => {
      const search = quickStringSearch(testList);
      const result = search('zzzzz');

      expect(result.total).to.equal(0);
      expect(result.results).to.be.an('array').with.lengthOf(0);
    });

    it('should handle partial matches', () => {
      const search = quickStringSearch(testList);
      const result = search('fox');

      expect(result.total).to.equal(1);
    });

    it('should be case-insensitive', () => {
      const search = quickStringSearch(testList);
      const result = search('UPPERCASE');

      expect(result.total).to.equal(1);
    });

    it('should intersperse results with LINE_BREAK', () => {
      const search = quickStringSearch(testList);
      const result = search('quick');

      expect(result.results).to.include(LINE_BREAK);
    });

    it('should handle empty list', () => {
      const search = quickStringSearch([]);
      const result = search('test');

      expect(result.total).to.equal(0);
      expect(result.results).to.be.an('array').with.lengthOf(0);
    });

    it('should handle undefined search term', () => {
      const search = quickStringSearch(testList);
      const result = search();

      expect(result).to.deep.equal(testList);
    });
  });

  describe('stopMouseEvents', () => {
    it('should call stopPropagation and preventDefault', () => {
      let stopPropagationCalled = false;
      let preventDefaultCalled = false;

      const mockEvent = {
        stopPropagation: () => {
          stopPropagationCalled = true;
        },
        preventDefault: () => {
          preventDefaultCalled = true;
        },
      };

      stopMouseEvents(mockEvent);

      expect(stopPropagationCalled).to.be.true;
      expect(preventDefaultCalled).to.be.true;
    });
  });
});
