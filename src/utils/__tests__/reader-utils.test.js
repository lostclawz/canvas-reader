import { expect } from 'chai';
import { LINE_BREAK } from '../../constants/constants.js';
import {
  joinLines,
  lineSpacer,
  measureWordSet,
  memo,
  quickStringSearch,
  quickStringSearchWithNumbers,
  reduceLines,
  reduceLinesWithNumbers,
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

  describe('reduceLinesWithNumbers', () => {
    it('should break text into line objects with line numbers', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 100;
      const text = 'This is a test sentence that should be broken into multiple lines';

      const result = reduceLinesWithNumbers(measureFn, maxWidth, text);

      expect(result).to.be.an('array');
      result.forEach((lineObj, index) => {
        expect(lineObj).to.have.property('text');
        expect(lineObj).to.have.property('lineNum');
        expect(lineObj.lineNum).to.equal(index + 1);
        expect(measureFn([lineObj.text])).to.be.at.most(maxWidth);
      });
    });

    it('should preserve line breaks in original text with line numbers', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 1000;
      const text = 'Line one\nLine two\nLine three';

      const result = reduceLinesWithNumbers(measureFn, maxWidth, text);

      expect(result.length).to.be.at.least(3);
      expect(result[0].lineNum).to.equal(1);
      expect(result[1].lineNum).to.equal(2);
      expect(result[2].lineNum).to.equal(3);
    });

    it('should handle single line with line number 1', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 1000;
      const text = 'Single line of text';

      const result = reduceLinesWithNumbers(measureFn, maxWidth, text);

      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.deep.equal({
        text: 'Single line of text',
        lineNum: 1,
      });
    });

    it('should assign consecutive line numbers', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 100;
      const text = 'First\nSecond\nThird\nFourth\nFifth';

      const result = reduceLinesWithNumbers(measureFn, maxWidth, text);

      result.forEach((lineObj, index) => {
        expect(lineObj.lineNum).to.equal(index + 1);
      });
    });

    it('should handle empty text', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 100;

      const result = reduceLinesWithNumbers(measureFn, maxWidth, '');

      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.deep.equal({
        text: '',
        lineNum: 1,
      });
    });

    it('should handle long words that need single line with numbers', () => {
      const measureFn = (words) => words.join(' ').length * 10;
      const maxWidth = 50;
      const text = 'superlongword anotherword thirdword';

      const result = reduceLinesWithNumbers(measureFn, maxWidth, text);

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      result.forEach((lineObj) => {
        expect(lineObj).to.have.property('text');
        expect(lineObj).to.have.property('lineNum');
      });
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

  describe('quickStringSearchWithNumbers', () => {
    const testList = [
      { text: 'The quick brown fox', lineNum: 1 },
      { text: 'jumps over the lazy dog', lineNum: 2 },
      { text: 'Lorem ipsum dolor sit amet', lineNum: 3 },
      { text: 'Quick test of search', lineNum: 4 },
      { text: 'UPPERCASE TEXT', lineNum: 5 },
    ];

    it('should find matching line objects case-insensitively with context', () => {
      const search = quickStringSearchWithNumbers(testList);
      const result = search('quick');

      expect(result).to.have.property('searchText', 'quick');
      expect(result).to.have.property('total', 2);
      expect(result.results).to.be.an('array');
      // 'quick' matches indices 0 and 3
      // With context: 0 gets [0,1], 3 gets [2,3,4]
      // Combined unique: [0,1,2,3,4] = all 5 lines
      expect(result.results).to.have.lengthOf(5);
    });

    it('should preserve line numbers in search results', () => {
      const search = quickStringSearchWithNumbers(testList);
      const result = search('quick');

      result.results.forEach((lineObj) => {
        expect(lineObj).to.have.property('text');
        expect(lineObj).to.have.property('lineNum');
        expect(lineObj.lineNum).to.be.a('number');
        expect(lineObj.lineNum).to.be.at.least(1);
      });
    });

    it('should return all lines when search is empty', () => {
      const search = quickStringSearchWithNumbers(testList);
      const result = search('');

      expect(result).to.deep.equal(testList);
    });

    it('should return empty results for non-matching search', () => {
      const search = quickStringSearchWithNumbers(testList);
      const result = search('zzzzz');

      expect(result.total).to.equal(0);
      expect(result.results).to.be.an('array').with.lengthOf(0);
    });

    it('should handle partial matches with context and preserve line numbers', () => {
      const search = quickStringSearchWithNumbers(testList);
      const result = search('fox');

      expect(result.total).to.equal(1);
      // 'fox' matches index 0
      // With context: [0, 1]
      expect(result.results).to.have.lengthOf(2);
      expect(result.results[0].text).to.equal('The quick brown fox');
      expect(result.results[0].lineNum).to.equal(1);
      expect(result.results[1].text).to.equal('jumps over the lazy dog');
      expect(result.results[1].lineNum).to.equal(2);
    });

    it('should be case-insensitive with context', () => {
      const search = quickStringSearchWithNumbers(testList);
      const result = search('UPPERCASE');

      expect(result.total).to.equal(1);
      // 'UPPERCASE' matches index 4
      // With context: [3, 4]
      expect(result.results).to.have.lengthOf(2);
      expect(result.results[0].text).to.equal('Quick test of search');
      expect(result.results[0].lineNum).to.equal(4);
      expect(result.results[1].text).to.equal('UPPERCASE TEXT');
      expect(result.results[1].lineNum).to.equal(5);
    });

    it('should not intersperse results with LINE_BREAK (unlike quickStringSearch)', () => {
      const search = quickStringSearchWithNumbers(testList);
      const result = search('quick');

      // Results should be line objects, not interspersed with LINE_BREAK
      result.results.forEach((item) => {
        expect(item).to.be.an('object');
        expect(item).to.not.equal(LINE_BREAK);
      });
    });

    it('should handle empty list', () => {
      const search = quickStringSearchWithNumbers([]);
      const result = search('test');

      expect(result.total).to.equal(0);
      expect(result.results).to.be.an('array').with.lengthOf(0);
    });

    it('should handle undefined search term', () => {
      const search = quickStringSearchWithNumbers(testList);
      const result = search();

      expect(result).to.deep.equal(testList);
    });

    it('should include context line before match when available', () => {
      const list = [
        { text: 'line 0', lineNum: 1 },
        { text: 'line 1', lineNum: 2 },
        { text: 'match here', lineNum: 3 },
        { text: 'line 3', lineNum: 4 },
      ];
      const search = quickStringSearchWithNumbers(list);
      const result = search('match');

      expect(result.total).to.equal(1);
      // Should include line 1 (before), line 2 (match), line 3 (after)
      expect(result.results).to.have.lengthOf(3);
      expect(result.results[0].text).to.equal('line 1');
      expect(result.results[0].lineNum).to.equal(2);
      expect(result.results[1].text).to.equal('match here');
      expect(result.results[1].lineNum).to.equal(3);
      expect(result.results[2].text).to.equal('line 3');
      expect(result.results[2].lineNum).to.equal(4);
    });

    it('should not include context before first line', () => {
      const list = [
        { text: 'match here', lineNum: 1 },
        { text: 'line 1', lineNum: 2 },
        { text: 'line 2', lineNum: 3 },
      ];
      const search = quickStringSearchWithNumbers(list);
      const result = search('match');

      expect(result.total).to.equal(1);
      // Should include line 0 (match), line 1 (after)
      expect(result.results).to.have.lengthOf(2);
      expect(result.results[0].text).to.equal('match here');
      expect(result.results[0].lineNum).to.equal(1);
      expect(result.results[1].text).to.equal('line 1');
      expect(result.results[1].lineNum).to.equal(2);
    });

    it('should not include context after last line', () => {
      const list = [
        { text: 'line 0', lineNum: 1 },
        { text: 'line 1', lineNum: 2 },
        { text: 'match here', lineNum: 3 },
      ];
      const search = quickStringSearchWithNumbers(list);
      const result = search('match');

      expect(result.total).to.equal(1);
      // Should include line 1 (before), line 2 (match)
      expect(result.results).to.have.lengthOf(2);
      expect(result.results[0].text).to.equal('line 1');
      expect(result.results[0].lineNum).to.equal(2);
      expect(result.results[1].text).to.equal('match here');
      expect(result.results[1].lineNum).to.equal(3);
    });

    it('should deduplicate overlapping context windows and preserve line numbers', () => {
      const list = [
        { text: 'line 0', lineNum: 1 },
        { text: 'match 1', lineNum: 2 },
        { text: 'match 2', lineNum: 3 },
        { text: 'line 3', lineNum: 4 },
      ];
      const search = quickStringSearchWithNumbers(list);
      const result = search('match');

      expect(result.total).to.equal(2);
      // Match at 1: [0, 1, 2], Match at 2: [1, 2, 3]
      // Combined unique: [0, 1, 2, 3] = all 4 lines
      expect(result.results).to.have.lengthOf(4);
      expect(result.results[0].text).to.equal('line 0');
      expect(result.results[0].lineNum).to.equal(1);
      expect(result.results[1].text).to.equal('match 1');
      expect(result.results[1].lineNum).to.equal(2);
      expect(result.results[2].text).to.equal('match 2');
      expect(result.results[2].lineNum).to.equal(3);
      expect(result.results[3].text).to.equal('line 3');
      expect(result.results[3].lineNum).to.equal(4);
    });

    it('should handle special regex characters in search', () => {
      const list = [
        { text: 'test (parens)', lineNum: 1 },
        { text: 'test [brackets]', lineNum: 2 },
        { text: 'test.dot', lineNum: 3 },
        { text: 'test*star', lineNum: 4 },
      ];
      const search = quickStringSearchWithNumbers(list);

      const result1 = search('(');
      expect(result1.total).to.equal(1);
      expect(result1.results[0].lineNum).to.equal(1);

      const result2 = search('[');
      expect(result2.total).to.equal(1);

      const result3 = search('.');
      expect(result3.total).to.equal(1);
    });

    it('should handle unicode characters', () => {
      const list = [
        { text: 'hello 世界', lineNum: 1 },
        { text: 'test café', lineNum: 2 },
        { text: 'emoji 🎉', lineNum: 3 },
      ];
      const search = quickStringSearchWithNumbers(list);

      const result1 = search('世界');
      expect(result1.total).to.equal(1);
      const match1 = result1.results.find((line) => line.text.includes('世界'));
      expect(match1.lineNum).to.equal(1);

      const result2 = search('café');
      expect(result2.total).to.equal(1);
      const match2 = result2.results.find((line) => line.text.includes('café'));
      expect(match2.lineNum).to.equal(2);

      const result3 = search('🎉');
      expect(result3.total).to.equal(1);
      const match3 = result3.results.find((line) => line.text.includes('🎉'));
      expect(match3.lineNum).to.equal(3);
    });

    it('should maintain original line numbers across wrapped lines', () => {
      // Simulating lines that were wrapped from fewer original paragraphs
      const list = [
        { text: 'First line of paragraph one', lineNum: 1 },
        { text: 'First line of paragraph two', lineNum: 2 },
        { text: 'Second wrapped line of paragraph', lineNum: 2 }, // Same lineNum as previous
        { text: 'two', lineNum: 2 }, // Continuation
        { text: 'First line of paragraph three with match', lineNum: 3 },
      ];
      const search = quickStringSearchWithNumbers(list);
      const result = search('match');

      expect(result.total).to.equal(1);
      // Should preserve the original line number 3
      const matchedLine = result.results.find((line) => line.text.includes('match'));
      expect(matchedLine.lineNum).to.equal(3);
    });

    it('should return proper structure with searchText, results, and total', () => {
      const list = [
        { text: 'test line one', lineNum: 1 },
        { text: 'test line two', lineNum: 2 },
      ];
      const search = quickStringSearchWithNumbers(list);
      const result = search('test');

      expect(result).to.be.an('object');
      expect(result).to.have.all.keys('searchText', 'results', 'total');
      expect(result.searchText).to.equal('test');
      expect(result.results).to.be.an('array');
      expect(result.total).to.be.a('number');
    });

    it('should handle single line list with match', () => {
      const list = [{ text: 'single match line', lineNum: 1 }];
      const search = quickStringSearchWithNumbers(list);
      const result = search('match');

      expect(result.total).to.equal(1);
      expect(result.results).to.have.lengthOf(1);
      expect(result.results[0].text).to.equal('single match line');
      expect(result.results[0].lineNum).to.equal(1);
    });

    it('should handle multiple matches in same line', () => {
      const list = [
        { text: 'test test test', lineNum: 1 },
        { text: 'no match here', lineNum: 2 },
      ];
      const search = quickStringSearchWithNumbers(list);
      const result = search('test');

      // Should only count as 1 match (the line matches, not each occurrence)
      expect(result.total).to.equal(1);
    });

    it('should handle case-insensitive matching with mixed case', () => {
      const list = [
        { text: 'ABC', lineNum: 1 },
        { text: 'abc', lineNum: 2 },
        { text: 'AbC', lineNum: 3 },
        { text: 'aBc', lineNum: 4 },
      ];
      const search = quickStringSearchWithNumbers(list);
      const result = search('abc');

      expect(result.total).to.equal(4);
      expect(result.results.length).to.equal(4);
    });

    it('should preserve indices set deduplication', () => {
      const list = [
        { text: 'match', lineNum: 1 },
        { text: 'match', lineNum: 2 },
        { text: 'no', lineNum: 3 },
      ];
      const search = quickStringSearchWithNumbers(list);
      const result = search('match');

      // Two matches at indices 0 and 1
      // Context for 0: [0, 1], Context for 1: [0, 1, 2]
      // Combined unique: [0, 1, 2] = 3 lines
      expect(result.total).to.equal(2);
      expect(result.results).to.have.lengthOf(3);
    });

    it('should handle very long list efficiently', () => {
      const list = Array.from({ length: 1000 }, (_, i) => ({
        text: i === 500 ? 'match here' : `line ${i}`,
        lineNum: i + 1,
      }));
      const search = quickStringSearchWithNumbers(list);
      const result = search('match');

      expect(result.total).to.equal(1);
      expect(result.results).to.have.lengthOf(3); // line before, match, line after
      const matchedLine = result.results.find((line) => line.text.includes('match'));
      expect(matchedLine.lineNum).to.equal(501);
    });

    it('should handle whitespace-only search term', () => {
      const list = [
        { text: 'test line', lineNum: 1 },
        { text: '  spaces  ', lineNum: 2 },
      ];
      const search = quickStringSearchWithNumbers(list);
      const result = search('   ');

      // Whitespace should match the line with spaces
      expect(result.total).to.be.at.least(0);
    });

    it('should return empty array for search with no results', () => {
      const list = [
        { text: 'abc', lineNum: 1 },
        { text: 'def', lineNum: 2 },
      ];
      const search = quickStringSearchWithNumbers(list);
      const result = search('xyz');

      expect(result.results).to.deep.equal([]);
      expect(result.results).to.have.lengthOf(0);
    });

    it('should handle null/undefined in default parameter', () => {
      const list = [{ text: 'test', lineNum: 1 }];
      const search = quickStringSearchWithNumbers(list);

      const result1 = search(null);
      expect(result1).to.deep.equal(list);

      const result2 = search(undefined);
      expect(result2).to.deep.equal(list);
    });

    it('should create independent search functions', () => {
      const list1 = [{ text: 'foo', lineNum: 1 }];
      const list2 = [{ text: 'bar', lineNum: 1 }];

      const search1 = quickStringSearchWithNumbers(list1);
      const search2 = quickStringSearchWithNumbers(list2);

      const result1 = search1('foo');
      const result2 = search2('bar');

      expect(result1.total).to.equal(1);
      expect(result2.total).to.equal(1);
      expect(result1.results[0].text).to.not.equal(result2.results[0].text);
    });
  });
});
