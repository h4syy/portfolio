import test from 'node:test';
import assert from 'node:assert/strict';
import { install } from './dom-stub.mjs';
const { makeEl } = install();
const { ForceGraph } = await import('../assets/js/graph.js');

test('ForceGraph constructs, renders, and reports selection without throwing', () => {
  const canvas = makeEl();
  let selected = null;
  const g = new ForceGraph(canvas, {
    nodes: [{ id:'a', r:12, cluster:0 }, { id:'b', r:12, cluster:0 }],
    edges: [{ a:'a', b:'b', w:0.9 }],
  }, { onSelect: id => (selected = id), reducedMotion: true });
  g.selectById('a');
  assert.equal(selected, 'a');
  g.destroy();
});
