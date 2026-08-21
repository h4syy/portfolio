import test from 'node:test';
import assert from 'node:assert/strict';
import { install } from './dom-stub.mjs';
const { makeEl } = install();
const { initGraph, openPanel } = await import('../assets/js/main.js');

const books = [
  { isbn:'a', status:'read', title:'A', authors:'x', categories:[], tags:[], description:'databases', cover:null, review:'r' },
  { isbn:'b', status:'read', title:'B', authors:'y', categories:[], tags:[], description:'databases', cover:null, review:'r' },
];

test('initGraph builds a ForceGraph without throwing and returns a handle', async () => {
  const canvas = makeEl();
  const g = await initGraph(books, { canvas, embedImpl: async t => t.map(() => [1, 0]) });
  assert.ok(g && typeof g.setData === 'function');
  g.destroy();
});

test('openPanel populates the panel element with the book review', () => {
  const panel = makeEl();
  openPanel(books[0], { panelEl: panel });
  assert.ok(String(panel.innerHTML).includes('A'));
});
