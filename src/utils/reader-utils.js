/**
 * @fileoverview Text processing utilities for the canvas reader.
 * Provides functions for text measurement, line breaking, search, and formatting.
 * Many functions are functional wrappers around Ramda operations for consistency.
 */

import * as R from 'ramda';
import { LINE_BREAK } from '../constants/constants.js';

/**
 * Memoization wrapper using identity function as cache key.
 * Caches function results based on the first argument's identity.
 * @type {Function}
 * @example
 * const expensiveFn = memo((x) => x * x);
 * expensiveFn(5); // Computed
 * expensiveFn(5); // Cached
 */
export const memo = R.memoizeWith(R.identity);

/**
 * Inserts LINE_BREAK characters between array elements.
 * @type {Function}
 * @example
 * lineSpacer(['a', 'b', 'c']); // ['a', '\n', 'b', '\n', 'c']
 */
export const lineSpacer = R.intersperse(LINE_BREAK);

/**
 * Splits text on LINE_BREAK characters into an array of lines.
 * @type {Function}
 * @example
 * splitLines('line1\nline2\nline3'); // ['line1', 'line2', 'line3']
 */
export const splitLines = R.split(LINE_BREAK);

/**
 * Joins an array of lines with LINE_BREAK characters.
 * @type {Function}
 * @example
 * joinLines(['line1', 'line2']); // 'line1\nline2'
 */
export const joinLines = R.join(LINE_BREAK);

/**
 * Creates a function that measures the width of an array of words when joined with spaces.
 * Uses the canvas measureText API to get pixel width.
 *
 * @param {CanvasRenderingContext2D} context - Canvas 2D rendering context for text measurement
 * @returns {Function} A function that takes an array of words and returns total width in pixels
 *
 * @example
 * const ctx = canvas.getContext('2d');
 * ctx.font = '16px Arial';
 * const measure = measureWordSet(ctx);
 * const width = measure(['Hello', 'World']); // Returns pixel width of "Hello World"
 */
export const measureWordSet = (context) =>
  R.pipe(R.join(' '), (txt) => context.measureText(txt), R.prop('width'));

/**
 * Breaks text into lines that fit within a maximum width.
 * Preserves original line breaks and wraps long lines to fit the width constraint.
 * Uses a greedy algorithm to pack as many words as possible on each line.
 *
 * @param {Function} measureFn - Function that takes an array of words and returns pixel width
 * @param {number} maxWidth - Maximum allowed width for each line in pixels
 * @param {string} text - Input text to be broken into lines
 * @returns {string[]} Array of lines, each fitting within maxWidth
 *
 * @example
 * const measure = (words) => words.join(' ').length * 10; // Simplified measurement
 * const lines = reduceLines(measure, 100, 'This is a long sentence that needs wrapping');
 * // Returns: ['This is a', 'long', 'sentence', 'that needs', 'wrapping']
 */
export const reduceLines = (measureFn, maxWidth, text) =>
  R.pipe(
    R.split('\n'),
    R.map(R.pipe(R.split(' '), R.map(R.trim))),
    R.chain(
      R.reduce(
        (lines, word) =>
          R.pipe(
            R.last,
            R.append(word),
            measureFn,
            R.ifElse(
              R.gt(R.__, maxWidth),
              () => lines.concat([[word]]),
              () => R.adjust(-1, R.append(word), lines)
            )
          )(lines),
        [[]]
      )
    ),
    R.map(R.join(' '))
  )(text);

/**
 * Breaks text into line objects with line numbers.
 * Similar to reduceLines but returns objects with {text, lineNum} for displaying line numbers.
 *
 * @param {Function} measureFn - Function that takes an array of words and returns pixel width
 * @param {number} maxWidth - Maximum allowed width for each line in pixels
 * @param {string} text - Input text to be broken into lines
 * @returns {Array<{text: string, lineNum: number}>} Array of line objects with numbers
 *
 * @example
 * const measure = (words) => words.join(' ').length * 10;
 * const lines = reduceLinesWithNumbers(measure, 100, 'First\nSecond line');
 * // Returns: [{text: 'First', lineNum: 1}, {text: 'Second line', lineNum: 2}]
 */
export const reduceLinesWithNumbers = (measureFn, maxWidth, text) => {
  const lines = R.pipe(
    R.split('\n'),
    R.map(R.pipe(R.split(' '), R.map(R.trim))),
    R.chain(
      R.reduce(
        (lines, word) =>
          R.pipe(
            R.last,
            R.append(word),
            measureFn,
            R.ifElse(
              R.gt(R.__, maxWidth),
              () => lines.concat([[word]]),
              () => R.adjust(-1, R.append(word), lines)
            )
          )(lines),
        [[]]
      )
    ),
    R.map(R.join(' '))
  )(text);

  return lines.map((text, index) => ({ text, lineNum: index + 1 }));
};

/**
 * Search result object.
 * @typedef {Object} SearchResult
 * @property {string} searchText - The search term that was used
 * @property {Array<string>} results - Matching lines interspersed with LINE_BREAK
 * @property {number} total - Total number of matches found
 */

/**
 * Creates a case-insensitive search function for an array of strings.
 * Returns a curried function that performs the search when given a query.
 * Includes one line before and one line after each match for context.
 *
 * @param {string[]} list - Array of strings to search within
 * @returns {Function} Search function that takes a search term and returns results
 *
 * @example
 * const lines = ['Line 1', 'Hello World', 'Line 3', 'Goodbye World', 'Line 5'];
 * const search = quickStringSearch(lines);
 *
 * const results = search('world');
 * // Returns: {
 * //   searchText: 'world',
 * //   results: ['Line 1', '\n', 'Hello World', '\n', 'Line 3', '\n', 'Goodbye World', '\n', 'Line 5'],
 * //   total: 2
 * // }
 *
 * search(''); // Returns original list (no search)
 */
export const quickStringSearch =
  (list) =>
  (searchFor = '') => {
    let i;
    const results = [];
    let total = 0;
    if (!searchFor) {
      return list;
    }
    const s = searchFor.toLowerCase();
    const indicesSet = new Set();

    // First pass: find all matches and collect indices with context
    for (i = 0; i < list.length; i++) {
      if (list[i].toLowerCase().indexOf(s) >= 0) {
        total++;
        // Add the line before (if it exists)
        if (i > 0) indicesSet.add(i - 1);
        // Add the matching line
        indicesSet.add(i);
        // Add the line after (if it exists)
        if (i < list.length - 1) indicesSet.add(i + 1);
      }
    }

    // Convert to sorted array and build results
    const sortedIndices = Array.from(indicesSet).sort((a, b) => a - b);
    for (i = 0; i < sortedIndices.length; i++) {
      results.push(list[sortedIndices[i]]);
    }

    return {
      searchText: searchFor,
      results: lineSpacer(results),
      total,
    };
  };

/**
 * Creates a case-insensitive search function for an array of line objects.
 * Returns a curried function that performs the search when given a query.
 * Includes one line before and one line after each match for context.
 * Preserves line numbers from the original document.
 *
 * @param {Array<{text: string, lineNum: number}>} list - Array of line objects to search
 * @returns {Function} Search function that takes a search term and returns filtered line objects
 *
 * @example
 * const lines = [{text: 'Line 1', lineNum: 1}, {text: 'Hello World', lineNum: 2}];
 * const search = quickStringSearchWithNumbers(lines);
 * const results = search('world'); // Returns matching lines with original line numbers
 */
export const quickStringSearchWithNumbers =
  (list) =>
  (searchFor = '') => {
    let i;
    const results = [];
    let total = 0;
    if (!searchFor) {
      return list;
    }
    const s = searchFor.toLowerCase();
    const indicesSet = new Set();

    // First pass: find all matches and collect indices with context
    for (i = 0; i < list.length; i++) {
      if (list[i].text.toLowerCase().indexOf(s) >= 0) {
        total++;
        // Add the line before (if it exists)
        if (i > 0) indicesSet.add(i - 1);
        // Add the matching line
        indicesSet.add(i);
        // Add the line after (if it exists)
        if (i < list.length - 1) indicesSet.add(i + 1);
      }
    }

    // Convert to sorted array and build results
    const sortedIndices = Array.from(indicesSet).sort((a, b) => a - b);
    for (i = 0; i < sortedIndices.length; i++) {
      results.push(list[sortedIndices[i]]);
    }

    return {
      searchText: searchFor,
      results,
      total,
    };
  };

/**
 * Stops event propagation and prevents default behavior.
 * Useful for preventing unwanted event bubbling and browser defaults.
 *
 * @param {Event} e - DOM event to stop
 *
 * @example
 * element.addEventListener('click', stopMouseEvents);
 * // Equivalent to:
 * element.addEventListener('click', (e) => {
 *   e.stopPropagation();
 *   e.preventDefault();
 * });
 */
export const stopMouseEvents = (e) => {
  e.stopPropagation();
  e.preventDefault();
};
