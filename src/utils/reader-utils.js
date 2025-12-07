import * as R from 'ramda';
import { LINE_BREAK } from '../constants/constants.js';

export const memo = R.memoizeWith(R.identity);
export const lineSpacer = R.intersperse(LINE_BREAK);
export const splitLines = R.split(LINE_BREAK);
export const joinLines = R.join(LINE_BREAK);
export const measureWordSet = (context) =>
  R.pipe(R.join(' '), (txt) => context.measureText(txt), R.prop('width'));
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
              () => lines.concat([ [word] ]),
              () => R.adjust(-1, R.append(word), lines)
            )
          )(lines),
        [[]]
      )
    ),
    R.map(R.join(' '))
  )(text);
export const quickStringSearch = (list) => (searchFor = '') => {
  let i;
  const results = [];
  let total = 0;
  if (!searchFor) {
    return list;
  }
  const s = searchFor.toLowerCase();
  for (i = 0; i < list.length; i++) {
    if (list[i].toLowerCase().indexOf(s) >= 0) {
      total++;
      results.push(list[i]);
    }
  }
  return {
    searchText: searchFor,
    results: lineSpacer(results),
    total,
  };
};
export const stopMouseEvents = (e) => {
  e.stopPropagation();
  e.preventDefault();
};
