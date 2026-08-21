import test from 'node:test';
import assert from 'node:assert/strict';
import { install } from './dom-stub.mjs';
install();
const { renderList } = await import('../assets/js/main.js');

test('renderList groups by status and shows ratings', () => {
  const html = renderList([
    { isbn:'a', status:'read', title:'A', authors:'x', rating:5, review:'great', cover:null },
    { isbn:'b', status:'want', title:'B', authors:'y', cover:null },
  ]);
  assert.ok(/Read/i.test(html) && /Want/i.test(html));
  assert.ok(html.includes('A') && html.includes('B'));
  assert.ok(html.includes('★'));
});
