import { getJSON, setJSON } from './storage.js';

const CACHE = 'books:v1:';
const BASE = 'https://www.googleapis.com/books/v1/volumes?q=';

export function slug(title) { return (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
export function bookKey(entry) { return entry.isbn || slug(entry.title); }
export function queryUrl(entry) {
  if (entry.isbn) return BASE + 'isbn:' + encodeURIComponent(entry.isbn);
  let q = 'intitle:' + encodeURIComponent(entry.title);
  if (entry.author) q += '+inauthor:' + encodeURIComponent(entry.author);
  return BASE + q;
}

export function monogram(title) {
  const words = (title || '?').trim().split(/\s+/).filter(Boolean);
  const a = (words[0] || '?')[0] || '?';
  const b = words[1] ? words[1][0] : ((words[0] || '?')[1] || '');
  return (a + b).toUpperCase();
}

export function parseVolume(json, entry) {
  const info = json && json.items && json.items[0] && json.items[0].volumeInfo;
  const base = {
    key: bookKey(entry), isbn: entry.isbn || null, status: entry.status || 'read',
    rating: entry.rating ?? null, review: entry.review || '', note: entry.note || '',
    progress: entry.progress ?? null, started: entry.started || null, finished: entry.finished || null,
    tags: entry.tags || [], degraded: false,
  };
  if (!info) {
    return { ...base, title: entry.title || entry.isbn || '?', authors: entry.author || '',
      cover: null, description: '', categories: [], pageCount: null, degraded: true };
  }
  const cover = info.imageLinks && (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail);
  return {
    ...base,
    title: info.title || entry.title || '?',
    authors: (info.authors && info.authors.join(', ')) || entry.author || '',
    cover: cover ? cover.replace(/^http:/, 'https:') : null,
    description: info.description || '',
    categories: info.categories || [],
    pageCount: info.pageCount || null,
  };
}

export async function fetchBook(entry, { fetchImpl = (...a) => fetch(...a) } = {}) {
  const key = CACHE + bookKey(entry);
  const cached = getJSON(key);
  if (cached) return { ...cached, ...personalFields(entry), key: bookKey(entry) };
  try {
    const res = await fetchImpl(queryUrl(entry));
    const json = await res.json();
    const book = parseVolume(json, entry);
    if (!book.degraded) setJSON(key, stripPersonal(book));
    return book;
  } catch {
    return parseVolume(null, entry); // degraded from local fields
  }
}

export async function loadShelf(shelf, opts = {}) {
  return Promise.all(shelf.map(entry => fetchBook(entry, opts).catch(() => parseVolume(null, entry))));
}

function personalFields(e) {
  return { status: e.status || 'read', rating: e.rating ?? null, review: e.review || '',
    note: e.note || '', progress: e.progress ?? null, started: e.started || null,
    finished: e.finished || null, tags: e.tags || [] };
}
function stripPersonal(b) {
  const { title, authors, cover, description, categories, pageCount, isbn, key } = b;
  return { title, authors, cover, description, categories, pageCount, isbn, key };
}
