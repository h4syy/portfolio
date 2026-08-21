import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, cosine, lexicalGraph } from '../assets/js/embed.js';

const books = [
  { isbn: 'a', title: 'Designing Data-Intensive Applications', authors: 'Kleppmann', categories: ['Computers'], tags: ['distributed','databases'], description: 'replication partitioning consistency distributed systems' },
  { isbn: 'b', title: 'Database Internals', authors: 'Petrov', categories: ['Computers'], tags: ['databases'], description: 'storage engines distributed databases replication' },
  { isbn: 'c', title: 'Thinking Fast and Slow', authors: 'Kahneman', categories: ['Psychology'], tags: ['cognition'], description: 'heuristics biases judgment decision psychology' },
];

test('tokenize drops stopwords and short tokens', () => {
  const t = tokenize('The quick a to systems');
  assert.ok(!t.includes('the') && !t.includes('to') && !t.includes('a'));
  assert.ok(t.includes('quick') && t.includes('systems'));
});

test('cosine is 1 for identical vectors and 0 for orthogonal', () => {
  assert.ok(Math.abs(cosine([1,0],[1,0]) - 1) < 1e-9);
  assert.equal(cosine([1,0],[0,1]), 0);
});

test('lexicalGraph produces valid, non-NaN nodes/edges referencing real ids', () => {
  const { nodes, edges } = lexicalGraph(books, { k: 2, threshold: 0.01 });
  assert.equal(nodes.length, 3);
  const ids = new Set(nodes.map(n => n.id));
  for (const e of edges) {
    assert.ok(ids.has(e.a) && ids.has(e.b));
    assert.ok(Number.isFinite(e.w));
  }
  for (const n of nodes) assert.ok(Number.isInteger(n.cluster) && Number.isFinite(n.r));
});

test('the two database books are more similar than either is to the psych book', () => {
  const { edges } = lexicalGraph(books, { k: 2, threshold: 0 });
  const w = (x, y) => (edges.find(e => (e.a===x&&e.b===y)||(e.a===y&&e.b===x))||{w:0}).w;
  assert.ok(w('a','b') > w('a','c'));
});
