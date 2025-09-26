// src/utils/safe.js
export const isArr = (v) => Array.isArray(v);

export const safeArray = (v) => (Array.isArray(v) ? v : []);

export const safeReduce = (arr, reducer, initial) => {
  const a = safeArray(arr);
  return a.reduce(reducer, initial);
};

export const safeSum = (arr, pick = (x) => x, initial = 0) => {
  const a = safeArray(arr);
  return a.reduce((acc, x) => acc + (Number(pick(x)) || 0), initial);
};

export const safeFlat = (arr) => safeArray(arr).flat ? safeArray(arr).flat() : [].concat(...safeArray(arr));
