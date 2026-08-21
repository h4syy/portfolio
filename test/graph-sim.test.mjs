import test from 'node:test';
import assert from 'node:assert/strict';
import { initLayout, simulateStep, settle, pickNode } from '../assets/js/graph.js';

function fixture() {
  const nodes = [ { id:'a', r:12, cluster:0 }, { id:'b', r:12, cluster:0 }, { id:'c', r:12, cluster:1 } ];
  const edges = [ { a:'a', b:'b', w:0.9 } ];
  return { nodes, edges };
}

test('settle produces finite positions and lowers energy', () => {
  const { nodes, edges } = fixture();
  initLayout(nodes, 800, 600);
  const e0 = simulateStep(nodes, edges, { W: 800, H: 600 });
  settle(nodes, edges, { W: 800, H: 600 }, 300);
  const eN = simulateStep(nodes, edges, { W: 800, H: 600 });
  for (const n of nodes) { assert.ok(Number.isFinite(n.x) && Number.isFinite(n.y)); }
  assert.ok(eN <= e0 + 1e-6);
});

test('connected nodes end up closer than unconnected ones', () => {
  const { nodes, edges } = fixture();
  initLayout(nodes, 800, 600);
  settle(nodes, edges, { W: 800, H: 600 }, 400);
  const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
  const [a, b, c] = nodes;
  assert.ok(d(a, b) < d(a, c));
});

test('pickNode returns the node under a point, else null', () => {
  const nodes = [{ id: 'a', r: 12, x: 100, y: 100 }];
  assert.equal(pickNode(nodes, 103, 103).id, 'a');
  assert.equal(pickNode(nodes, 400, 400), null);
});
