import test from 'node:test';
import assert from 'node:assert/strict';
import { similarityGraph } from '../assets/js/embed.js';

test('similarityGraph uses embedImpl and returns semantic mode', async () => {
  const books = [
    { isbn: 'a1', title: 'A', authors: '', categories: [], tags: [], description: 'x', status: 'read' },
    { isbn: 'b1', title: 'B', authors: '', categories: [], tags: [], description: 'y', status: 'read' },
  ];
  let calls = 0;
  const embedImpl = async (texts) => { calls++; return texts.map((_, i) => [i === 0 ? 1 : 0, i === 0 ? 0 : 1]); };
  const g = await similarityGraph(books, { k: 1, threshold: 0, embedImpl });
  assert.equal(g.mode, 'semantic');
  assert.equal(g.nodes.length, 2);
  assert.equal(calls, 1);
});

test('similarityGraph caches vectors per isbn (second call embeds nothing new)', async () => {
  const books = [
    { isbn: 'a2', title: 'A', authors: '', categories: [], tags: [], description: 'x', status: 'read' },
    { isbn: 'b2', title: 'B', authors: '', categories: [], tags: [], description: 'y', status: 'read' },
  ];
  let embedded = [];
  const embedImpl = async (texts) => { embedded.push(texts.length); return texts.map(() => [1, 0]); };
  await similarityGraph(books, { embedImpl });
  await similarityGraph(books, { embedImpl });
  assert.equal(embedded[0], 2);   // first call embeds both
  assert.equal(embedded.length === 1 || embedded[1] === 0, true); // second embeds none
});

test('similarityGraph falls back to lexical when embedImpl throws', async () => {
  const books = [
    { isbn: 'a3', title: 'A', authors: '', categories: [], tags: [], description: 'x', status: 'read' },
    { isbn: 'b3', title: 'B', authors: '', categories: [], tags: [], description: 'y', status: 'read' },
  ];
  const embedImpl = async () => { throw new Error('no model'); };
  const g = await similarityGraph(books, { embedImpl });
  assert.equal(g.mode, 'lexical');
  assert.equal(g.nodes.length, 2);
});
