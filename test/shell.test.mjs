import test from 'node:test';
import assert from 'node:assert/strict';
import { install } from './dom-stub.mjs';
install();
const { renderProfile, renderCurrentlyReading } = await import('../assets/js/main.js');

test('renderProfile writes name/role/links into the provided nodes', () => {
  const nameEl = { textContent: '' }, roleEl = { textContent: '' };
  renderProfile({ name: 'Yash', role: 'Engineer', tagline: 't', links: { github: '#' } }, { nameEl, roleEl });
  assert.equal(nameEl.textContent, 'Yash');
  assert.equal(roleEl.textContent, 'Engineer');
});

test('renderCurrentlyReading returns markup only for reading books', () => {
  const html = renderCurrentlyReading([
    { isbn:'a', status:'reading', title:'A', authors:'x', progress:0.5, cover:null, note:'n' },
    { isbn:'b', status:'read', title:'B', authors:'y' },
  ]);
  assert.ok(html.includes('A'));
  assert.ok(!html.includes('>B<'));
});
