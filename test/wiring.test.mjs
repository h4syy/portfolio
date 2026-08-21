import test from 'node:test';
import assert from 'node:assert/strict';
import { install } from './dom-stub.mjs';
const { makeEl } = install();
const { openPanel } = await import('../assets/js/main.js');

const books = [
  { isbn: 'a', status: 'read', title: 'A', authors: 'x', categories: [], tags: [], cover: null, review: 'r' },
];

test('openPanel populates the panel element with the book review', () => {
  const panel = makeEl();
  openPanel(books[0], { panelEl: panel });
  assert.ok(String(panel.innerHTML).includes('A'));
});
