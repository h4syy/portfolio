import test from 'node:test';
import assert from 'node:assert/strict';
import { slug, bookKey, monogram, coverUrl, toBook, loadShelf } from '../assets/js/books.js';

test('slug and bookKey derive a stable id from title when no isbn', () => {
  assert.equal(slug('The Art of War'), 'the-art-of-war');
  assert.equal(bookKey({ title: 'The Art of War' }), 'the-art-of-war');
  assert.equal(bookKey({ title: 'x', isbn: '123' }), '123');
});

test('monogram returns initials', () => {
  assert.equal(monogram('Designing Data-Intensive Applications'), 'DD');
  assert.equal(monogram('Refactoring'), 'RE');
});

test('coverUrl builds an Open Library cover URL by ISBN with default=false, null without', () => {
  const u = coverUrl('9780140449334', 'M');
  assert.ok(u.includes('covers.openlibrary.org/b/isbn/9780140449334-M.jpg'));
  assert.ok(u.includes('default=false'));
  assert.ok(coverUrl('9780140449334', 'L').includes('-L.jpg'));
  assert.equal(coverUrl(null), null);
  assert.equal(coverUrl(undefined), null);
});

test('toBook maps local fields, sets cover from isbn, key from isbn', () => {
  const b = toBook({ title: 'Meditations', author: 'Marcus Aurelius', isbn: '9780140449334', status: 'read', rating: 5, review: 'stoic', tags: ['philosophy'] });
  assert.equal(b.title, 'Meditations');
  assert.equal(b.authors, 'Marcus Aurelius');
  assert.equal(b.key, '9780140449334');
  assert.ok(b.cover.includes('9780140449334-M.jpg'));
  assert.ok(b.coverLarge.includes('9780140449334-L.jpg'));
  assert.equal(b.rating, 5);
  assert.equal(b.review, 'stoic');
  assert.deepEqual(b.categories, ['philosophy']); // tags feed the panel chips + embedding text
  assert.equal(b.degraded, false);
});

test('toBook without isbn → no cover, key from slug', () => {
  const b = toBook({ title: 'How to Survive a Black Hole', status: 'read' });
  assert.equal(b.cover, null);
  assert.equal(b.coverLarge, null);
  assert.equal(b.key, 'how-to-survive-a-black-hole');
  assert.equal(b.authors, '');
});

test('loadShelf maps entries preserving order, no network', async () => {
  const out = await loadShelf([{ title: 'A', status: 'read' }, { title: 'B', status: 'want' }]);
  assert.equal(out.length, 2);
  assert.equal(out[0].title, 'A');
  assert.equal(out[1].status, 'want');
});
