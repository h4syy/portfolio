import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVolume, monogram, fetchBook, loadShelf, slug, bookKey, queryUrl } from '../assets/js/books.js';

const VOL = { totalItems: 1, items: [{ volumeInfo: {
  title: 'Designing Data-Intensive Applications', authors: ['Martin Kleppmann'],
  description: 'The big ideas behind reliable, scalable systems.',
  categories: ['Computers'], pageCount: 616,
  imageLinks: { thumbnail: 'http://books.example/ddia.jpg' } } }] };

test('slug and bookKey derive a stable id from title when no isbn', () => {
  assert.equal(slug('The Art of War'), 'the-art-of-war');
  assert.equal(bookKey({ title: 'The Art of War' }), 'the-art-of-war');
  assert.equal(bookKey({ title: 'x', isbn: '123' }), '123');
});

test('queryUrl searches by title+author, or by isbn override', () => {
  assert.ok(queryUrl({ title: 'Sapiens', author: 'Harari' }).includes('intitle:'));
  assert.ok(queryUrl({ title: 'Sapiens', author: 'Harari' }).includes('inauthor:'));
  assert.ok(queryUrl({ title: 'x', isbn: '123' }).includes('isbn:123'));
});

test('parseVolume maps fields, sets key, upgrades http cover to https', () => {
  const b = parseVolume(VOL, { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', status: 'reading', progress: 0.6 });
  assert.equal(b.title, 'Designing Data-Intensive Applications');
  assert.equal(b.authors, 'Martin Kleppmann');
  assert.equal(b.key, 'designing-data-intensive-applications');
  assert.equal(b.pageCount, 616);
  assert.ok(b.cover.startsWith('https://'));
  assert.equal(b.status, 'reading');
  assert.equal(b.degraded, false);
});

test('parseVolume falls back to entry title/author on empty result', () => {
  const b = parseVolume({ totalItems: 0, items: [] }, { title: 'Local', author: 'Me' });
  assert.equal(b.title, 'Local');
  assert.equal(b.authors, 'Me');
  assert.equal(b.cover, null);
  assert.equal(b.degraded, true);
});

test('monogram returns initials', () => {
  assert.equal(monogram('Designing Data-Intensive Applications'), 'DD');
  assert.equal(monogram('Refactoring'), 'RE');
});

test('fetchBook returns degraded book when fetch throws', async () => {
  const b = await fetchBook({ title: 'Offline Title', author: 'A' },
    { fetchImpl: async () => { throw new Error('network'); } });
  assert.equal(b.degraded, true);
  assert.equal(b.title, 'Offline Title');
});

test('loadShelf preserves order and never rejects', async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => VOL });
  const out = await loadShelf(
    [{ title: 'One', status: 'read' }, { title: 'Two', status: 'want' }], { fetchImpl });
  assert.equal(out.length, 2);
  assert.equal(out[0].title, 'Designing Data-Intensive Applications');
});
