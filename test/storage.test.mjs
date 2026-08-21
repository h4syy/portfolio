import test from 'node:test';
import assert from 'node:assert/strict';
import { get, set, getJSON, setJSON } from '../assets/js/storage.js';

test('set/get round-trips a string', () => {
  set('k', 'v');
  assert.equal(get('k'), 'v');
});

test('getJSON/setJSON round-trips an object', () => {
  setJSON('obj', { a: 1, b: [2, 3] });
  assert.deepEqual(getJSON('obj'), { a: 1, b: [2, 3] });
});

test('get returns null for missing key', () => {
  assert.equal(get('nope'), null);
});

test('getJSON returns null on malformed json', () => {
  set('bad', '{not json');
  assert.equal(getJSON('bad'), null);
});
