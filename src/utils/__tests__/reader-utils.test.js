import { expect } from 'chai';
import { LINE_BREAK } from '../../constants/constants.js';
import {
  joinLines,
  lineSpacer,
  measureWordSet,
  memo,
  quickStringSearch,
  reduceLines,
  splitLines,
  stopMouseEvents,
} from '../reader-utils.js';

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
      expect(result).to.deep.equal(['line1', LINE_BREAK, 'line2', LINE_BREAK, 'line3']);
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
      const text = 'This is a test sentence that should be broken into multiple lines';

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

    it('should find matching lines case-insensitively with context', () => {
      const search = quickStringSearch(testList);
      const result = search('quick');

      expect(result).to.have.property('searchText', 'quick');
      expect(result).to.have.property('total', 2);
      expect(result.results).to.be.an('array');
      // 'quick' matches indices 0 and 3
      // With context: 0 gets [0,1], 3 gets [2,3,4]
      // Combined unique: [0,1,2,3,4] = all 5 lines
      const resultLines = result.results.filter((line) => line !== LINE_BREAK);
      expect(resultLines).to.have.lengthOf(5);
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

    it('should handle partial matches with context', () => {
      const search = quickStringSearch(testList);
      const result = search('fox');

      expect(result.total).to.equal(1);
      // 'fox' matches index 0
      // With context: [0, 1]
      const resultLines = result.results.filter((line) => line !== LINE_BREAK);
      expect(resultLines).to.have.lengthOf(2);
      expect(resultLines[0]).to.equal('The quick brown fox');
      expect(resultLines[1]).to.equal('jumps over the lazy dog');
    });

    it('should be case-insensitive with context', () => {
      const search = quickStringSearch(testList);
      const result = search('UPPERCASE');

      expect(result.total).to.equal(1);
      // 'UPPERCASE' matches index 4
      // With context: [3, 4] (no line after since it's the last line)
      const resultLines = result.results.filter((line) => line !== LINE_BREAK);
      expect(resultLines).to.have.lengthOf(2);
      expect(resultLines[0]).to.equal('Quick test of search');
      expect(resultLines[1]).to.equal('UPPERCASE TEXT');
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

    it('should include context line before match when available', () => {
      const list = ['line 0', 'line 1', 'match here', 'line 3'];
      const search = quickStringSearch(list);
      const result = search('match');

      expect(result.total).to.equal(1);
      const resultLines = result.results.filter((line) => line !== LINE_BREAK);
      // Should include line 1 (before), line 2 (match), line 3 (after)
      expect(resultLines).to.have.lengthOf(3);
      expect(resultLines[0]).to.equal('line 1');
      expect(resultLines[1]).to.equal('match here');
      expect(resultLines[2]).to.equal('line 3');
    });

    it('should include context line after match when available', () => {
      const list = ['line 0', 'match here', 'line 2', 'line 3'];
      const search = quickStringSearch(list);
      const result = search('match');

      expect(result.total).to.equal(1);
      const resultLines = result.results.filter((line) => line !== LINE_BREAK);
      // Should include line 0 (before), line 1 (match), line 2 (after)
      expect(resultLines).to.have.lengthOf(3);
      expect(resultLines[0]).to.equal('line 0');
      expect(resultLines[1]).to.equal('match here');
      expect(resultLines[2]).to.equal('line 2');
    });

    it('should not include context before first line', () => {
      const list = ['match here', 'line 1', 'line 2'];
      const search = quickStringSearch(list);
      const result = search('match');

      expect(result.total).to.equal(1);
      const resultLines = result.results.filter((line) => line !== LINE_BREAK);
      // Should include line 0 (match), line 1 (after)
      expect(resultLines).to.have.lengthOf(2);
      expect(resultLines[0]).to.equal('match here');
      expect(resultLines[1]).to.equal('line 1');
    });

    it('should not include context after last line', () => {
      const list = ['line 0', 'line 1', 'match here'];
      const search = quickStringSearch(list);
      const result = search('match');

      expect(result.total).to.equal(1);
      const resultLines = result.results.filter((line) => line !== LINE_BREAK);
      // Should include line 1 (before), line 2 (match)
      expect(resultLines).to.have.lengthOf(2);
      expect(resultLines[0]).to.equal('line 1');
      expect(resultLines[1]).to.equal('match here');
    });

    it('should deduplicate overlapping context windows', () => {
      const list = ['line 0', 'match 1', 'match 2', 'line 3'];
      const search = quickStringSearch(list);
      const result = search('match');

      expect(result.total).to.equal(2);
      const resultLines = result.results.filter((line) => line !== LINE_BREAK);
      // Match at 1: [0, 1, 2], Match at 2: [1, 2, 3]
      // Combined unique: [0, 1, 2, 3] = all 4 lines
      expect(resultLines).to.have.lengthOf(4);
      expect(resultLines[0]).to.equal('line 0');
      expect(resultLines[1]).to.equal('match 1');
      expect(resultLines[2]).to.equal('match 2');
      expect(resultLines[3]).to.equal('line 3');
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

    it('should work with real DOM events', () => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });

      stopMouseEvents(event);

      // Event should be prevented and stopped
      expect(event.defaultPrevented).to.be.true;
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle reduceLines with very long words', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 50;
      const text = `a ${'supercalifragilisticexpialidocious'.repeat(3)} b`;

      const result = reduceLines(measureFn, maxWidth, text);

      expect(result).to.be.an('array');
      result.forEach((line) => {
        expect(line).to.be.a('string');
      });
    });

    it('should handle measureWordSet with special characters', () => {
      const mockContext = {
        measureText: (text) => ({ width: text.length * 10 }),
      };

      const measure = measureWordSet(mockContext);
      const width = measure(['hello@world', '123-456', 'test_case']);

      expect(width).to.be.a('number');
      expect(width).to.be.greaterThan(0);
    });

    it('should handle quickStringSearch with special regex characters', () => {
      const testList = ['test (parens)', 'test [brackets]', 'test.dot', 'test*star'];
      const search = quickStringSearch(testList);

      const result1 = search('(');
      expect(result1.total).to.equal(1);

      const result2 = search('[');
      expect(result2.total).to.equal(1);

      const result3 = search('.');
      expect(result3.total).to.equal(1);
    });

    it('should handle reduceLines with only whitespace', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 100;
      const text = '   \n\n   \n   ';

      const result = reduceLines(measureFn, maxWidth, text);

      expect(result).to.be.an('array');
    });

    it('should handle memo with different argument types', () => {
      const fn = memo((x) => {
        if (typeof x === 'object') return JSON.stringify(x);
        return String(x);
      });

      expect(fn('test')).to.equal('test');
      expect(fn(123)).to.equal('123');
      expect(fn(true)).to.equal('true');
    });

    it('should handle quickStringSearch with very long search term', () => {
      const testList = ['short', 'medium length text', 'a'.repeat(1000)];
      const search = quickStringSearch(testList);
      const longSearch = 'a'.repeat(500);

      const result = search(longSearch);
      expect(result.total).to.equal(1);
    });

    it('should handle reduceLines with mixed whitespace types', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 100;
      const text = 'word1\tword2  word3\n\nword4';

      const result = reduceLines(measureFn, maxWidth, text);

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
    });

    it('should handle joinLines and splitLines as inverse operations', () => {
      const original = ['line1', 'line2', 'line3'];
      const joined = joinLines(original);
      const split = splitLines(joined);

      expect(split).to.deep.equal(original);
    });

    it('should handle lineSpacer with mixed content types', () => {
      const result = lineSpacer(['a', '', 'b', ' ', 'c']);
      expect(result).to.include(LINE_BREAK);
      expect(result.filter((x) => x === LINE_BREAK).length).to.equal(4);
    });

    it('should handle measureWordSet with empty strings in array', () => {
      const mockContext = {
        measureText: (text) => ({ width: text.length * 10 }),
      };

      const measure = measureWordSet(mockContext);
      const width = measure(['hello', '', 'world', '']);

      expect(width).to.be.a('number');
    });

    it('should handle reduceLines with extremely narrow maxWidth', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 1;
      const text = 'a b c d';

      const result = reduceLines(measureFn, maxWidth, text);

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
    });

    it('should handle quickStringSearch with unicode characters', () => {
      const testList = ['hello 世界', 'test café', 'emoji 🎉'];
      const search = quickStringSearch(testList);

      const result1 = search('世界');
      expect(result1.total).to.equal(1);

      const result2 = search('café');
      expect(result2.total).to.equal(1);

      const result3 = search('🎉');
      expect(result3.total).to.equal(1);
    });

    it('should handle reduceLines with all single-character words', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 100;
      const text = 'a b c d e f g h i j k l m n o p';

      const result = reduceLines(measureFn, maxWidth, text);

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
    });

    it('should handle quickStringSearch case sensitivity properly', () => {
      const testList = ['ABC', 'abc', 'AbC', 'aBc'];
      const search = quickStringSearch(testList);

      const result = search('abc');
      expect(result.total).to.equal(4);
    });
  });
});
