// Book data layer. No rate-limited JSON API: metadata comes from the local shelf, and
// covers are direct Open Library cover-IMAGE URLs (loaded by the browser as <img>, so
// there is no API call to rate-limit). A missing/unknown cover 404s and the UI shows a
// monogram instead (see the <img onerror> in main.js).

const OL_COVER = 'https://covers.openlibrary.org/b/isbn/';

export function slug(title) {
  return (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function bookKey(entry) {
  return entry.isbn || slug(entry.title);
}

export function monogram(title) {
  const words = (title || '?').trim().split(/\s+/).filter(Boolean);
  const a = (words[0] || '?')[0] || '?';
  const b = words[1] ? words[1][0] : ((words[0] || '?')[1] || '');
  return (a + b).toUpperCase();
}

// size: 'S' | 'M' | 'L'. `default=false` makes an unknown cover 404 (→ monogram fallback)
// rather than serving Open Library's blank-book placeholder.
export function coverUrl(isbn, size = 'M') {
  return isbn ? `${OL_COVER}${encodeURIComponent(isbn)}-${size}.jpg?default=false` : null;
}

export function toBook(entry) {
  return {
    key: bookKey(entry),
    isbn: entry.isbn || null,
    status: entry.status || 'read',
    title: entry.title || '?',
    authors: entry.author || '',
    cover: coverUrl(entry.isbn, 'M'),
    coverLarge: coverUrl(entry.isbn, 'L'),
    description: entry.description || '',
    categories: entry.categories || entry.tags || [],
    pageCount: null,
    rating: entry.rating ?? null,
    review: entry.review || '',
    note: entry.note || '',
    progress: entry.progress ?? null,
    started: entry.started || null,
    finished: entry.finished || null,
    tags: entry.tags || [],
    degraded: false,
  };
}

// Async signature kept for API compatibility with callers; resolves instantly (no network).
export async function loadShelf(shelf) {
  return shelf.map(toBook);
}
