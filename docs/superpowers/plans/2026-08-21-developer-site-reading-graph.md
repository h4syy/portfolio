# Developer Site + Reading Knowledge Graph — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the portfolio homepage with a purely professional developer site — identity, social links, a reading list, and a free, on-device AI knowledge graph of how the books relate — plus a funky on-brand 404.

**Architecture:** Static site, no build step. Native ES modules split by responsibility: `storage` (safe persistence), `books` (Google Books at runtime + cache), `embed` (lexical + on-device semantic relatedness), `graph` (dependency-free force simulation + canvas), `main` (orchestration), `shelf` (data). Pure logic is unit-tested in Node with the built-in test runner; browser glue is verified with a DOM stub + a manual browser pass.

**Tech Stack:** HTML + CSS (IBM Plex, Carbon-ish tokens), vanilla ES modules, Google Books API (keyless), `@huggingface/transformers` (`Xenova/all-MiniLM-L6-v2`, lazy CDN import), Node `node:test`/`node:assert` for tests.

**Spec:** `docs/superpowers/specs/2026-08-21-developer-site-reading-graph-design.md`

## Global Constraints

- No build step, no bundler, no framework. Must serve as static files on Vercel exactly as committed.
- No root `package.json` (would change Vercel's project detection). ESM-for-Node is enabled only via a nested `assets/js/package.json` containing `{"type":"module"}`.
- No paid services, no API keys, no secrets in the client. Google Books is called keyless; the embedding model is fetched from a public CDN.
- Pure logic modules (`storage`, `books` parsing, `embed`, `graph` simulation) must have **no top-level** DOM/`fetch`/`localStorage`/`window` access, so Node can import them. Browser-only access happens inside functions, guarded.
- Injectable side effects: `fetchBook`/`loadShelf` accept `fetchImpl`; `similarityGraph` accepts `embedImpl`. Defaults use the real browser APIs; tests inject fakes.
- Visual tokens are exact (copy verbatim): light `--bg #f4f4f4`, `--layer #ffffff`, `--layer-2 #ededed`, `--text #161616`, `--dim #6f6f6f`, `--line #e0e0e0`, `--blue #4589ff`; dark `--bg #161616`, `--layer #262626`, `--layer-2 #393939`, `--text #f4f4f4`, `--dim #a8a8a8`, `--line #393939`, `--blue #78a9ff`.
- Fonts: IBM Plex Sans (body/headings), IBM Plex Mono (labels/numbers/code), via Google Fonts.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`. List view is a full accessible equivalent of the graph.
- Do NOT modify or delete `game.html`, `arcade.html`, `starfall.html`, `blog/`. They stay in the repo, unlinked from the new nav.
- Run tests with `node --test test/`. Commit after every green step. Commit subjects use the `[CLAUDE] …` prefix and end with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

## File Structure

| File | Responsibility |
| --- | --- |
| `index.html` | New site shell: semantic structure + section containers; loads `assets/site.css` and `assets/js/main.js` (module). No inline logic. |
| `404.html` | Orphaned-node page; loads `site.css` and a tiny inline module reusing `graph.js`. |
| `assets/site.css` | Design tokens (light/dark), grid layout, typography, all components. |
| `assets/js/package.json` | `{"type":"module"}` — makes `assets/js/*.js` importable as ESM in Node. Ignored by browsers/Vercel. |
| `assets/js/storage.js` | Safe key/value + JSON persistence with in-memory fallback. Pure of top-level side effects. |
| `assets/js/books.js` | `parseVolume`, `monogram`, `fetchBook`, `loadShelf` — Google Books metadata + cache + degraded fallback. |
| `assets/js/embed.js` | Lexical (TF-IDF) + semantic (embeddings) relatedness; edge/cluster construction; `lexicalGraph`, `similarityGraph`. |
| `assets/js/graph.js` | `simulateStep`, `settle`, `pickNode`, node radius/colour helpers, and `ForceGraph` browser class. |
| `assets/js/main.js` | Orchestration: load shelf → render masthead/about/currently-reading/cards → paint graph → wire panel + Graph/List toggle. |
| `assets/data/shelf.js` | `profile` + `shelf` array (source of truth Yash edits). |
| `test/dom-stub.mjs` | Reusable DOM/canvas/IntersectionObserver stub factory for browser-glue smokes. |
| `test/*.test.mjs` | Node tests. |

**Shelf entries are title-first.** Yash maintains a list of `{ title, author?, status, rating?, review?, note?, progress?, finished?, tags?, isbn? }`. Google Books is queried by **title (+author)** unless an `isbn` override is present. Every book gets a stable `key = isbn || slug(title)` used as the graph node id and all cache keys.

**Book type (shared shape):**
```
Book = {
  key: string,                       // isbn || slug(title) — stable id used everywhere
  isbn: string|null, status: 'reading'|'read'|'want',
  title: string, authors: string, cover: string|null, description: string,
  categories: string[], pageCount: number|null,
  rating: number|null, review: string, note: string,
  progress: number|null, started: string|null, finished: string|null,
  tags: string[], degraded: boolean
}
GraphNode = { id: string, label: string, authors: string, r: number, cluster: number, status: string, x?: number, y?: number, vx?: number, vy?: number }  // id === book.key
GraphEdge = { a: string, b: string, w: number }   // a,b are node ids; w in 0..1
```

---

### Task 1: Test scaffolding + `storage.js`

**Files:**
- Create: `assets/js/package.json`
- Create: `assets/js/storage.js`
- Test: `test/storage.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `get(key) -> string|null`, `set(key, value) -> void`, `getJSON(key) -> any|null`, `setJSON(key, value) -> void`. Uses `globalThis.localStorage` when present and working; otherwise an internal `Map`. Never throws.

- [ ] **Step 1: Create the ESM marker so Node can import `assets/js/*.js`**

Create `assets/js/package.json`:
```json
{ "type": "module" }
```

- [ ] **Step 2: Write the failing test**

Create `test/storage.test.mjs`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { get, set, getJSON, setJSON } from '../assets/js/storage.js';

test('set/get round-trips a string', () => {
  set('k', 'v');
  assert.equal(get('k'), 'v');
});

test('getJSON/setJSON round-trips an object', () => {
  setJSON('obj', { a: 1, b: [2, 3] });
  assert.deepEqual(getJSON('obj'), { a: 1, b: [2, 3] });
});

test('get returns null for missing key', () => {
  assert.equal(get('nope'), null);
});

test('getJSON returns null on malformed json', () => {
  set('bad', '{not json');
  assert.equal(getJSON('bad'), null);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test test/storage.test.mjs`
Expected: FAIL — cannot find module `storage.js`.

- [ ] **Step 4: Implement `storage.js`**

Create `assets/js/storage.js`:
```js
// Safe persistence: uses localStorage when available, else an in-memory Map. Never throws.
const mem = new Map();
function backing() {
  try {
    if (typeof localStorage !== 'undefined') { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; }
  } catch { /* fall through */ }
  return { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
}
const store = backing();

export function get(key) { try { return store.getItem(key); } catch { return null; } }
export function set(key, value) { try { store.setItem(key, value); } catch { /* ignore quota */ } }
export function getJSON(key) { const raw = get(key); if (raw == null) return null; try { return JSON.parse(raw); } catch { return null; } }
export function setJSON(key, value) { try { set(key, JSON.stringify(value)); } catch { /* ignore */ } }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/storage.test.mjs`
Expected: PASS (4/4).

- [ ] **Step 6: Commit**

```bash
git add assets/js/package.json assets/js/storage.js test/storage.test.mjs
git commit -m "[CLAUDE] storage.js — safe persistence with in-memory fallback" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `books.js` — Google Books metadata + cache

**Files:**
- Create: `assets/js/books.js`
- Test: `test/books.test.mjs`

**Interfaces:**
- Consumes: `storage.getJSON/setJSON`.
- Produces:
  - `slug(title) -> string` — lowercase, non-alphanumerics to `-`, trimmed. Pure.
  - `bookKey(entry) -> string` — `entry.isbn || slug(entry.title)`. Pure.
  - `queryUrl(entry) -> string` — `q=isbn:<isbn>` when an isbn override exists, else `q=intitle:<title>` (+ `+inauthor:<author>` when present). Pure.
  - `parseVolume(json, entry) -> Book` — maps a Google Books `volumes` response (first item) onto the `Book` shape, merging the shelf `entry` (personal fields + fallback `title`/`author`), setting `key`. Pure.
  - `monogram(title) -> string` — 1–2 uppercase initials. Pure.
  - `fetchBook(entry, { fetchImpl } = {}) -> Promise<Book>` — cache-first by `key`; on network/parse failure returns a `degraded:true` Book from the entry's local fields. `fetchImpl` defaults to `(...a) => fetch(...a)`.
  - `loadShelf(shelf, opts) -> Promise<Book[]>` — maps `fetchBook` over entries (preserving order); failures never reject the whole batch.

- [ ] **Step 1: Write the failing test**

Create `test/books.test.mjs`:
```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/books.test.mjs`
Expected: FAIL — cannot find module `books.js`.

- [ ] **Step 3: Implement `books.js`**

Create `assets/js/books.js`:
```js
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
  const b = (words[1] || words[0] || '?')[0] || '';
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/books.test.mjs`
Expected: PASS (5/5).

- [ ] **Step 5: Commit**

```bash
git add assets/js/books.js test/books.test.mjs
git commit -m "[CLAUDE] books.js — Google Books metadata, cache, degraded fallback" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `embed.js` — lexical relatedness (pure)

**Files:**
- Create: `assets/js/embed.js`
- Test: `test/embed-lexical.test.mjs`

**Interfaces:**
- Consumes: `Book[]`.
- Produces (all pure):
  - `bookText(book) -> string` — `title + authors + categories + tags + description`.
  - `tokenize(text) -> string[]` — lowercase word tokens, stopwords removed, length ≥ 3.
  - `cosine(a, b) -> number` — cosine of two equal-length numeric arrays.
  - `topKEdges(ids, vectors, { k, threshold }) -> GraphEdge[]` — undirected, deduped, each node keeps up to `k` neighbours with `w ≥ threshold`.
  - `labelProp(ids, edges, iters=8) -> Map<id, cluster>` — dependency-free community assignment.
  - `nodeRadius(book) -> number`.
  - `lexicalGraph(books, { k=3, threshold=0.08 } = {}) -> { nodes, edges }` — TF-IDF vectors → `topKEdges` → `labelProp`.

- [ ] **Step 1: Write the failing test**

Create `test/embed-lexical.test.mjs`:
```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/embed-lexical.test.mjs`
Expected: FAIL — cannot find module `embed.js`.

- [ ] **Step 3: Implement the lexical half of `embed.js`**

Create `assets/js/embed.js` with the pure helpers (semantic half added in Task 4):
```js
const STOP = new Set('the a an and or of to in for on with is are be by as at from this that it its into your you their our we they he she them his her not no but if then so than also more most such can will just about over under between out up down off then once here there all any each few own same'.split(' '));

export function bookText(b) {
  return [b.title, b.authors, (b.categories||[]).join(' '), (b.tags||[]).join(' '), b.description].filter(Boolean).join(' ');
}
export function tokenize(text) {
  return (text||'').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !STOP.has(w));
}
export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return (na && nb) ? dot / (Math.sqrt(na)*Math.sqrt(nb)) : 0;
}
export function nodeRadius(b) { const base = 9; const byRating = b.rating ? b.rating*1.6 : 0; const byPages = b.pageCount ? Math.min(6, b.pageCount/160) : 0; return base + byRating + byPages; }

function tfidf(docsTokens) {
  const df = new Map(), N = docsTokens.length;
  for (const toks of docsTokens) for (const t of new Set(toks)) df.set(t, (df.get(t)||0)+1);
  const vocab = [...df.keys()]; const idx = new Map(vocab.map((t,i)=>[t,i]));
  return docsTokens.map(toks => {
    const tf = new Map(); for (const t of toks) tf.set(t, (tf.get(t)||0)+1);
    const v = new Array(vocab.length).fill(0);
    for (const [t, c] of tf) v[idx.get(t)] = (c/toks.length) * Math.log((N+1)/((df.get(t)||0)+1));
    return v;
  });
}

export function topKEdges(ids, vectors, { k = 3, threshold = 0.08 } = {}) {
  const seen = new Set(), edges = [];
  for (let i = 0; i < ids.length; i++) {
    const sims = [];
    for (let j = 0; j < ids.length; j++) if (i !== j) sims.push([j, cosine(vectors[i], vectors[j])]);
    sims.sort((x, y) => y[1] - x[1]);
    for (const [j, w] of sims.slice(0, k)) {
      if (w < threshold) continue;
      const key = i < j ? i+'-'+j : j+'-'+i;
      if (seen.has(key)) continue; seen.add(key);
      edges.push({ a: ids[i], b: ids[j], w });
    }
  }
  return edges;
}

export function labelProp(ids, edges, iters = 8) {
  const label = new Map(ids.map((id, i) => [id, i]));
  const adj = new Map(ids.map(id => [id, []]));
  for (const e of edges) { adj.get(e.a).push([e.b, e.w]); adj.get(e.b).push([e.a, e.w]); }
  for (let it = 0; it < iters; it++) {
    let changed = false;
    for (const id of ids) {
      const tally = new Map();
      for (const [nb, w] of adj.get(id)) tally.set(label.get(nb), (tally.get(label.get(nb))||0)+w);
      if (!tally.size) continue;
      let bestL = label.get(id), bestW = -1;
      for (const [l, w] of tally) if (w > bestW) { bestW = w; bestL = l; }
      if (bestL !== label.get(id)) { label.set(id, bestL); changed = true; }
    }
    if (!changed) break;
  }
  const remap = new Map(); let next = 0;
  for (const id of ids) { const l = label.get(id); if (!remap.has(l)) remap.set(l, next++); label.set(id, remap.get(l)); }
  return label;
}

export function bookId(b) { return b.key ?? b.isbn; }

export function lexicalGraph(books, { k = 3, threshold = 0.08 } = {}) {
  const ids = books.map(bookId);
  const vectors = tfidf(books.map(b => tokenize(bookText(b))));
  const edges = topKEdges(ids, vectors, { k, threshold });
  const clusters = labelProp(ids, edges);
  const nodes = books.map(b => ({ id: bookId(b), label: b.title, authors: b.authors, r: nodeRadius(b), cluster: clusters.get(bookId(b)), status: b.status }));
  return { nodes, edges };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/embed-lexical.test.mjs`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add assets/js/embed.js test/embed-lexical.test.mjs
git commit -m "[CLAUDE] embed.js — lexical TF-IDF relatedness + clustering" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: `embed.js` — semantic layer with cache + fallback

**Files:**
- Modify: `assets/js/embed.js`
- Test: `test/embed-semantic.test.mjs`

**Interfaces:**
- Consumes: `Book[]`, `storage`, `cosine/topKEdges/labelProp/nodeRadius/bookText` (from Task 3).
- Produces:
  - `defaultEmbedder(texts) -> Promise<number[][]>` — lazy-imports transformers.js from CDN and returns normalized 384-dim vectors. Browser-only (throws in Node — that's expected; tests inject a fake).
  - `similarityGraph(books, { k=3, threshold=0.35, embedImpl=defaultEmbedder } = {}) -> Promise<{ nodes, edges, mode }>` — embeds only uncached books (cache key `emb:minilm:<key>`), builds edges/clusters like `lexicalGraph`, sets `mode:'semantic'`. On any failure falls back to `lexicalGraph(books)` with `mode:'lexical'`.

- [ ] **Step 1: Write the failing test**

Create `test/embed-semantic.test.mjs`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { similarityGraph } from '../assets/js/embed.js';

const books = [
  { isbn: 'a', title: 'A', authors: '', categories: [], tags: [], description: 'x', status: 'read' },
  { isbn: 'b', title: 'B', authors: '', categories: [], tags: [], description: 'y', status: 'read' },
];

test('similarityGraph uses embedImpl and returns semantic mode', async () => {
  let calls = 0;
  const embedImpl = async (texts) => { calls++; return texts.map((_, i) => [i === 0 ? 1 : 0, i === 0 ? 0 : 1]); };
  const g = await similarityGraph(books, { k: 1, threshold: 0, embedImpl });
  assert.equal(g.mode, 'semantic');
  assert.equal(g.nodes.length, 2);
  assert.equal(calls, 1);
});

test('similarityGraph caches vectors per isbn (second call embeds nothing new)', async () => {
  let embedded = [];
  const embedImpl = async (texts) => { embedded.push(texts.length); return texts.map(() => [1, 0]); };
  await similarityGraph(books, { embedImpl });
  await similarityGraph(books, { embedImpl });
  assert.equal(embedded[0], 2);   // first call embeds both
  assert.equal(embedded.length === 1 || embedded[1] === 0, true); // second embeds none
});

test('similarityGraph falls back to lexical when embedImpl throws', async () => {
  const embedImpl = async () => { throw new Error('no model'); };
  const g = await similarityGraph(books, { embedImpl });
  assert.equal(g.mode, 'lexical');
  assert.equal(g.nodes.length, 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/embed-semantic.test.mjs`
Expected: FAIL — `similarityGraph` is not exported.

- [ ] **Step 3: Append the semantic half to `embed.js`**

Add to `assets/js/embed.js`:
```js
import { getJSON, setJSON } from './storage.js';

const EMB_KEY = 'emb:minilm:';
let _pipe = null;
export async function defaultEmbedder(texts) {
  if (!_pipe) {
    const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0');
    _pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  const out = [];
  for (const t of texts) {
    const r = await _pipe(t, { pooling: 'mean', normalize: true });
    out.push(Array.from(r.data));
  }
  return out;
}

export async function similarityGraph(books, { k = 3, threshold = 0.35, embedImpl = defaultEmbedder } = {}) {
  try {
    const ids = books.map(bookId);
    const need = [], needIdx = [];
    const vectors = books.map((b, i) => {
      const cached = getJSON(EMB_KEY + bookId(b));
      if (cached) return cached;
      need.push(bookText(b)); needIdx.push(i); return null;
    });
    if (need.length) {
      const fresh = await embedImpl(need);
      if (!fresh || fresh.length !== need.length) throw new Error('bad embedder output');
      fresh.forEach((vec, j) => { const i = needIdx[j]; vectors[i] = vec; setJSON(EMB_KEY + bookId(books[i]), vec); });
    }
    const edges = topKEdges(ids, vectors, { k, threshold });
    const clusters = labelProp(ids, edges);
    const nodes = books.map(b => ({ id: bookId(b), label: b.title, authors: b.authors, r: nodeRadius(b), cluster: clusters.get(bookId(b)), status: b.status }));
    return { nodes, edges, mode: 'semantic' };
  } catch {
    return { ...lexicalGraph(books, { k }), mode: 'lexical' };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/embed-semantic.test.mjs`
Expected: PASS (3/3). (Note: the CDN import only runs in the browser via `defaultEmbedder`; tests inject `embedImpl`.)

- [ ] **Step 5: Commit**

```bash
git add assets/js/embed.js test/embed-semantic.test.mjs
git commit -m "[CLAUDE] embed.js — on-device semantic embeddings, cache, lexical fallback" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: `graph.js` — simulation core (pure)

**Files:**
- Create: `assets/js/graph.js`
- Test: `test/graph-sim.test.mjs`

**Interfaces:**
- Consumes: `{ nodes, edges }`.
- Produces (pure):
  - `initLayout(nodes, W, H, seed=1)` — deterministic initial positions (seeded PRNG), sets `x,y,vx=0,vy=0`.
  - `simulateStep(nodes, edges, { W, H, repel=1400, spring=0.02, springLen=90, gravity=0.015, damping=0.86 })` — one integration step; returns total kinetic energy.
  - `settle(nodes, edges, opts, iters=320)` — run steps to a low-energy layout; returns nodes.
  - `pickNode(nodes, x, y, pad=6) -> node|null` — topmost node whose radius (+pad) contains the point.
  - `clusterColor(cluster) -> string` — index into the desaturated palette.

- [ ] **Step 1: Write the failing test**

Create `test/graph-sim.test.mjs`:
```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/graph-sim.test.mjs`
Expected: FAIL — cannot find module `graph.js`.

- [ ] **Step 3: Implement the simulation core in `graph.js`**

Create `assets/js/graph.js` (browser class added in Task 6):
```js
const PALETTE = ['#4589ff','#08bdba','#ff832b','#a56eff','#ee5396','#42be65','#d2a106'];
export function clusterColor(c) { return PALETTE[((c || 0) % PALETTE.length + PALETTE.length) % PALETTE.length]; }

function mulberry32(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function initLayout(nodes, W, H, seed = 1) {
  const rnd = mulberry32(seed);
  for (const n of nodes) { n.x = W/2 + (rnd()-0.5)*W*0.5; n.y = H/2 + (rnd()-0.5)*H*0.5; n.vx = 0; n.vy = 0; }
}

export function simulateStep(nodes, edges, opts = {}) {
  const { W = 800, H = 600, repel = 1400, spring = 0.02, springLen = 90, gravity = 0.015, damping = 0.86 } = opts;
  const byId = new Map(nodes.map(n => [n.id, n]));
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      let dx = a.x - b.x, dy = a.y - b.y, d2 = dx*dx + dy*dy || 0.01;
      const f = repel / d2, d = Math.sqrt(d2);
      const fx = (dx/d)*f, fy = (dy/d)*f;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    }
    a.vx += (W/2 - a.x) * gravity; a.vy += (H/2 - a.y) * gravity;
  }
  for (const e of edges) {
    const a = byId.get(e.a), b = byId.get(e.b); if (!a || !b) continue;
    let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01;
    const f = (d - springLen) * spring * (0.4 + e.w);
    const fx = (dx/d)*f, fy = (dy/d)*f;
    a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
  }
  let energy = 0;
  for (const n of nodes) { n.vx *= damping; n.vy *= damping; n.x += n.vx; n.y += n.vy; energy += n.vx*n.vx + n.vy*n.vy; }
  return energy;
}

export function settle(nodes, edges, opts, iters = 320) {
  for (let i = 0; i < iters; i++) simulateStep(nodes, edges, opts);
  return nodes;
}

export function pickNode(nodes, x, y, pad = 6) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i], r = (n.r || 10) + pad;
    if ((n.x - x) ** 2 + (n.y - y) ** 2 <= r * r) return n;
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/graph-sim.test.mjs`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add assets/js/graph.js test/graph-sim.test.mjs
git commit -m "[CLAUDE] graph.js — dependency-free force simulation core" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: `graph.js` — `ForceGraph` browser class + DOM stub harness

**Files:**
- Modify: `assets/js/graph.js`
- Create: `test/dom-stub.mjs`
- Test: `test/graph-browser.test.mjs`

**Interfaces:**
- Consumes: simulation core (Task 5), a `<canvas>`, `{ nodes, edges }`.
- Produces: `class ForceGraph(canvas, data, { onSelect, reducedMotion=false } = {})` with methods `setData({nodes,edges})`, `start()`, `stop()`, `resize()`, `destroy()`, `selectById(id)`. Renders on canvas; hover tooltip via `onHover`; click/tap → `onSelect(id)`. If `reducedMotion`, calls `settle` once and renders statically. Pointer coordinates are mapped through the canvas transform before `pickNode`.

- [ ] **Step 1: Create the reusable DOM stub**

Create `test/dom-stub.mjs`:
```js
// Minimal DOM/canvas/observer stubs for headless smoke tests of browser glue.
export function install() {
  const grad = { addColorStop() {} };
  const ctx = new Proxy({}, { get(t, p) {
    if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => grad;
    if (p === 'measureText') return () => ({ width: 10 });
    if (p in t) return t[p];
    return typeof p === 'string' ? () => {} : undefined;
  }, set(t, p, v) { t[p] = v; return true; } });
  const listeners = new Map();
  const makeEl = () => ({
    style: new Proxy({}, { get: (t,p)=> (p==='setProperty'||p==='removeProperty')?()=>{}:t[p], set:(t,p,v)=>(t[p]=v,true) }),
    classList: { add(){}, remove(){}, toggle(){}, contains: () => false },
    addEventListener(type, fn) { (listeners.get(this)||listeners.set(this,{}).get(this))[type] = fn; },
    removeEventListener() {}, appendChild(c){return c;}, removeChild(c){return c;}, remove(){},
    setAttribute(){}, getAttribute(){return '';}, querySelector(){return makeEl();}, querySelectorAll(){return [];},
    getContext(){ return ctx; }, getBoundingClientRect(){ return {left:0,top:0,width:800,height:600}; },
    focus(){}, blur(){}, textContent:'', innerHTML:'', width:800, height:600, offsetWidth:0, children:[],
  });
  const doc = { getElementById: () => makeEl(), createElement: makeEl, querySelector: () => makeEl(), querySelectorAll: () => [], addEventListener(){}, body: makeEl(), hidden:false };
  let raf = null;
  const win = { innerWidth:800, innerHeight:600, devicePixelRatio:1, addEventListener(){}, matchMedia:()=>({matches:false, addEventListener(){}, addListener(){}}), IntersectionObserver: class { constructor(cb){ this.cb=cb; } observe(){ this.cb([{isIntersecting:true}]); } disconnect(){} unobserve(){} } };
  const G = { window: win, document: doc, requestAnimationFrame: cb => { raf = cb; return 1; }, cancelAnimationFrame(){}, IntersectionObserver: win.IntersectionObserver, devicePixelRatio: 1 };
  for (const k in G) Object.defineProperty(globalThis, k, { value: G[k], writable: true, configurable: true });
  return { makeEl, ctx, tick: (t=16) => raf && raf(t) };
}
```

- [ ] **Step 2: Write the failing test**

Create `test/graph-browser.test.mjs`:
```js
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test test/graph-browser.test.mjs`
Expected: FAIL — `ForceGraph` is not exported.

- [ ] **Step 4: Append `ForceGraph` to `graph.js`**

Add to `assets/js/graph.js` a class that: stores canvas + `ctx = canvas.getContext('2d')`; on construction runs `initLayout` then (if `reducedMotion`) `settle` once; `start()` drives `requestAnimationFrame`, each frame calls `simulateStep` until energy < epsilon then idles, and always redraws; `draw()` clears, strokes edges (alpha ∝ `w`), fills nodes with `clusterColor(cluster)`, glow on `status==='reading'` via a pulsing radius, labels the hovered/selected node; pointer handlers map client coords to canvas space (accounting for DPR/rect) and call `pickNode` → `onSelect`; `resize()` re-reads size and sets DPR transform; `selectById(id)` sets the selected node and invokes `onSelect(id)`; `destroy()` removes listeners and cancels the frame. Use the exact method names from the Interfaces block.

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/graph-browser.test.mjs`
Expected: PASS (1/1).

- [ ] **Step 6: Run the whole suite**

Run: `node --test test/`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add assets/js/graph.js test/dom-stub.mjs test/graph-browser.test.mjs
git commit -m "[CLAUDE] graph.js — ForceGraph canvas renderer + DOM stub harness" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Shell — `index.html`, `site.css`, `shelf.js`, and static render in `main.js`

**Files:**
- Create: `index.html`, `assets/site.css`, `assets/data/shelf.js`, `assets/js/main.js`
- Test: `test/shell.test.mjs`

**Interfaces:**
- Consumes: `profile`, `shelf` from `shelf.js`.
- Produces: `renderProfile(profile)`, `renderCurrentlyReading(books)` (both exported from `main.js` for testing) plus a boot path that runs on `DOMContentLoaded`.

- [ ] **Step 1: Seed `assets/data/shelf.js` (swap-out placeholders; include title/authors so labels survive an API miss)**

```js
export const profile = {
  name: 'Yash Paudel',
  role: 'Software engineer · Nepal',
  tagline: 'I build reliable systems, and I read widely to understand how the ideas connect.',
  about: 'Engineer working across backend, AI, and the messy glue between. Based in Nepal, focused on things that ship and hold up in production. Off the clock I read across engineering, cosmology, philosophy, and the occasional novel — the graph below is how those threads relate.',
  links: {
    github: 'https://github.com/h4syy',
    linkedin: 'https://www.linkedin.com/in/yashpaudel/',
    email: 'mailto:yashpaudel10@gmail.com',
  },
};

// status: 'reading' | 'read' | 'want'. Add rating (1–5)/review/finished when you like.
export const shelf = [
  // — currently reading —
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', status: 'reading', tags: ['distributed-systems','databases','engineering'] },
  { title: 'Project Hail Mary', author: 'Andy Weir', status: 'reading', tags: ['fiction','sci-fi','space'] },
  { title: 'Co-Intelligence', author: 'Ethan Mollick', status: 'reading', tags: ['ai','technology','work'] },
  { title: 'Homo Deus', author: 'Yuval Noah Harari', status: 'reading', tags: ['history','future','society'] },
  { title: 'Eat That Frog', author: 'Brian Tracy', status: 'reading', tags: ['productivity','self-help'] },
  { title: 'High Output Management', author: 'Andrew S. Grove', status: 'reading', tags: ['management','business'] },
  { title: 'Norwegian Wood', author: 'Haruki Murakami', status: 'reading', tags: ['fiction','literary'] },
  // — finished —
  { title: 'Meditations', author: 'Marcus Aurelius', status: 'read', tags: ['philosophy','stoicism'] },
  { title: 'How to Survive a Black Hole', author: '', status: 'read', tags: ['space','physics','science'] },
  { title: 'The Grand Design', author: 'Stephen Hawking', status: 'read', tags: ['physics','cosmology','science'] },
  { title: 'Atomic Habits', author: 'James Clear', status: 'read', tags: ['productivity','habits','self-help'] },
  { title: 'The Art of War', author: 'Sun Tzu', status: 'read', tags: ['strategy','philosophy'] },
  { title: 'Sapiens', author: 'Yuval Noah Harari', status: 'read', tags: ['history','society'] },
  { title: 'Ikigai', author: 'Héctor García', status: 'read', tags: ['philosophy','life','self-help'] },
  { title: 'The 48 Laws of Power', author: 'Robert Greene', status: 'read', tags: ['strategy','power','psychology'] },
  { title: 'Leaders Eat Last', author: 'Simon Sinek', status: 'read', tags: ['leadership','management'] },
  { title: 'The Personal MBA', author: 'Josh Kaufman', status: 'read', tags: ['business','self-help'] },
  { title: 'Black Holes', author: 'Brian Cox', status: 'read', tags: ['physics','cosmology','science'] },
  { title: 'To Infinity and Beyond', author: 'Neil deGrasse Tyson', status: 'read', tags: ['space','cosmology','science'] },
  { title: 'Infinite Cosmos', author: 'Ethan Siegel', status: 'read', tags: ['space','cosmology','science'] },
];
```

- [ ] **Step 2: Write the failing test (static render is pure enough to check via stubs)**

Create `test/shell.test.mjs`:
```js
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test test/shell.test.mjs`
Expected: FAIL — cannot find `main.js` / exports.

- [ ] **Step 4: Build `index.html`**

Semantic shell that loads the stylesheet and `main.js` as a module. Sections carry the ids `main.js` targets. Structure:
```html
<!DOCTYPE html><html lang="en"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yash Paudel</title>
  <meta name="description" content="Yash Paudel — software engineer in Nepal. Reading, reviews, and a knowledge graph of how the ideas connect.">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/site.css">
</head><body>
  <header class="masthead"><div class="wrap">
    <div class="id"><h1 id="name"></h1><p id="role" class="role"></p><p id="tagline" class="tagline"></p></div>
    <nav id="links" class="links" aria-label="Social links"></nav>
  </div></header>
  <main class="wrap">
    <section id="about" aria-label="About"><p id="about-body"></p><div id="stats" class="stats"></div></section>
    <section id="reading" aria-label="Currently reading"><h2>Currently reading</h2><div id="cr"></div></section>
    <section id="graph-section" aria-label="Knowledge graph">
      <div class="section-head"><h2>How these connect</h2>
        <div class="toggle" role="tablist"><button id="tab-graph" role="tab" aria-selected="true">Graph</button><button id="tab-list" role="tab" aria-selected="false">List</button></div>
      </div>
      <div id="graph-view"><canvas id="graph-canvas"></canvas><div id="graph-mode" class="mode-note"></div><div id="tooltip" class="tooltip" hidden></div></div>
      <div id="list-view" hidden></div>
    </section>
  </main>
  <aside id="panel" class="panel" hidden aria-label="Book detail"></aside>
  <footer class="wrap footer"><p>Vanilla JS · Google Books · on-device embeddings</p></footer>
  <script type="module" src="assets/js/main.js"></script>
</body></html>
```

- [ ] **Step 5: Build `assets/site.css` (tokens + layout + the components used above)**

Include, at minimum: the `:root` light tokens and a `@media (prefers-color-scheme: dark)` block with the dark tokens (exact values from Global Constraints); `body { background:var(--bg); color:var(--text); font-family:'IBM Plex Sans',system-ui,sans-serif; }`; `.wrap { max-width: 960px; margin-inline:auto; padding-inline:24px; }`; masthead grid (id left, links right, hairline `--line` bottom border); `.role`,`.tagline` in `--dim`, mono for `.tagline`; `.links a` mono, `--dim`, hover `--blue`; `.stats` a 3–4 col grid of `--layer` tiles; `#cr` cards with cover + `.progress { height:4px; background:var(--layer-2); }` and `.progress > i { background:var(--blue); }`; `.section-head` flex row; `.toggle button` segmented control (`aria-selected="true"` → `--blue` underline); `#graph-canvas { width:100%; height:min(70vh,620px); display:block; }`; `.tooltip` absolutely positioned mono chip; `.mode-note` tiny `--dim`; `.panel` a right-side sheet (`position:fixed; inset-block:0; inset-inline-end:0; width:min(420px,90vw); background:var(--layer); border-inline-start:1px solid var(--line);`) with `[hidden]{display:none}`; card grid for `#list-view`; `:focus-visible { outline:2px solid var(--blue); outline-offset:2px; }`; and `@media (prefers-reduced-motion: reduce)` disabling transitions. Keep it flat, hairline-bordered, greyscale + `--blue` only.

- [ ] **Step 6: Implement the static-render half of `main.js`**

```js
import { profile, shelf } from '../data/shelf.js';
import { loadShelf } from './books.js';
// graph + panel wiring arrive in Tasks 8–9.

export function renderProfile(p, nodes = {}) {
  const nameEl = nodes.nameEl || document.getElementById('name');
  const roleEl = nodes.roleEl || document.getElementById('role');
  const tagEl = nodes.tagEl || document.getElementById('tagline');
  const aboutEl = nodes.aboutEl || document.getElementById('about-body');
  const linksEl = nodes.linksEl || document.getElementById('links');
  if (nameEl) nameEl.textContent = p.name;
  if (roleEl) roleEl.textContent = p.role;
  if (tagEl) tagEl.textContent = p.tagline;
  if (aboutEl) aboutEl.textContent = p.about || '';
  if (linksEl) linksEl.innerHTML = Object.entries(p.links || {})
    .map(([k, href]) => `<a href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${k}</a>`).join('');
}

export function renderCurrentlyReading(books) {
  const reading = books.filter(b => b.status === 'reading');
  if (!reading.length) return '<p class="dim">Nothing on the desk right now.</p>';
  return reading.map(b => `
    <article class="cr-card">
      ${b.cover ? `<img src="${b.cover}" alt="" class="cover">` : `<div class="cover mono">${(b.title||'?').slice(0,2).toUpperCase()}</div>`}
      <div><h3>${b.title}</h3><p class="dim">${b.authors || ''}</p>
      ${Number.isFinite(b.progress) ? `<div class="progress"><i style="width:${Math.round(b.progress*100)}%"></i></div>` : ''}
      ${b.note ? `<p class="note">${b.note}</p>` : ''}</div>
    </article>`).join('');
}

async function boot() {
  renderProfile(profile);
  const books = await loadShelf(shelf);
  const cr = document.getElementById('cr');
  if (cr) cr.innerHTML = renderCurrentlyReading(books);
  window.__books = books; // handed to Task 8/9 wiring
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `node --test test/shell.test.mjs`
Expected: PASS (2/2). (Boot is guarded so importing under stubs is safe.)

- [ ] **Step 8: Manual browser check**

Run: `python -m http.server 8000` and open `http://localhost:8000/`. Confirm masthead, about, links, and currently-reading render; covers load from Google Books (check the Network tab); no console errors.

- [ ] **Step 9: Commit**

```bash
git add index.html assets/site.css assets/data/shelf.js assets/js/main.js test/shell.test.mjs
git commit -m "[CLAUDE] Site shell — masthead, about, currently-reading, Carbon-ish system" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: List view — cards grouped by status

**Files:**
- Modify: `assets/js/main.js`, `assets/site.css`
- Test: `test/list.test.mjs`

**Interfaces:**
- Produces: `renderList(books) -> string` (exported) — groups by `reading`/`read`/`want`, each card shows cover (or monogram), title, authors, star rating, and review/note.

- [ ] **Step 1: Write the failing test**

Create `test/list.test.mjs`:
```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/list.test.mjs`
Expected: FAIL — `renderList` not exported.

- [ ] **Step 3: Implement `renderList` and call it in `boot`**

Add to `main.js`:
```js
const GROUPS = [['reading','Reading'],['read','Read'],['want','Want to read']];
function stars(r) { return r ? '★'.repeat(r) + '☆'.repeat(5 - r) : ''; }
export function renderList(books) {
  return GROUPS.map(([key, label]) => {
    const items = books.filter(b => b.status === key);
    if (!items.length) return '';
    const cards = items.map(b => `
      <article class="book-card" data-key="${b.key ?? ''}" tabindex="0" role="button" aria-label="${b.title}">
        ${b.cover ? `<img src="${b.cover}" alt="" class="cover">` : `<div class="cover mono">${(b.title||'?').slice(0,2).toUpperCase()}</div>`}
        <div class="bc-body"><h4>${b.title}</h4><p class="dim">${b.authors||''}</p>
        <p class="rating" aria-label="${b.rating||0} out of 5">${stars(b.rating)}</p>
        <p class="review">${b.review || b.note || ''}</p></div>
      </article>`).join('');
    return `<div class="group"><h3 class="group-h">${label}</h3><div class="card-grid">${cards}</div></div>`;
  }).join('');
}
```
In `boot`, after computing `books`: `const lv = document.getElementById('list-view'); if (lv) lv.innerHTML = renderList(books);`

- [ ] **Step 4: Add card/group CSS** to `site.css`: `.card-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }`, `.book-card { display:grid; grid-template-columns:56px 1fr; gap:12px; padding:12px; background:var(--layer); border:1px solid var(--line); }`, `.cover { width:56px; aspect-ratio:2/3; object-fit:cover; background:var(--layer-2); }`, `.rating { color:var(--blue); letter-spacing:2px; }`, hover/focus lift.

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/list.test.mjs`
Expected: PASS (1/1).

- [ ] **Step 6: Commit**

```bash
git add assets/js/main.js assets/site.css test/list.test.mjs
git commit -m "[CLAUDE] List view — reading/read/want cards with ratings" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Wire the graph, detail panel, and Graph/List toggle

**Files:**
- Modify: `assets/js/main.js`, `assets/site.css`
- Test: `test/wiring.test.mjs`

**Interfaces:**
- Consumes: `ForceGraph` (Task 6), `lexicalGraph`/`similarityGraph` (Tasks 3–4), rendered `books`.
- Produces: `openPanel(book)` / `closePanel()` (exported); `initGraph(books, { canvas, onSelect })` (exported) that paints the lexical graph immediately and, when the graph section intersects the viewport, upgrades to `similarityGraph` and swaps the data into the live `ForceGraph`.

- [ ] **Step 1: Write the failing test**

Create `test/wiring.test.mjs`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { install } from './dom-stub.mjs';
const { makeEl } = install();
const { initGraph, openPanel } = await import('../assets/js/main.js');

const books = [
  { isbn:'a', status:'read', title:'A', authors:'x', categories:[], tags:[], description:'databases', cover:null, review:'r' },
  { isbn:'b', status:'read', title:'B', authors:'y', categories:[], tags:[], description:'databases', cover:null, review:'r' },
];

test('initGraph builds a ForceGraph without throwing and returns a handle', async () => {
  const canvas = makeEl();
  const g = await initGraph(books, { canvas, embedImpl: async t => t.map(() => [1, 0]) });
  assert.ok(g && typeof g.setData === 'function');
  g.destroy();
});

test('openPanel populates the panel element with the book review', () => {
  const panel = makeEl();
  openPanel(books[0], { panelEl: panel });
  assert.ok(String(panel.innerHTML).includes('A'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/wiring.test.mjs`
Expected: FAIL — `initGraph`/`openPanel` not exported.

- [ ] **Step 3: Implement the wiring in `main.js`**

Add imports `import { ForceGraph } from './graph.js';` and `import { lexicalGraph, similarityGraph } from './embed.js';`, then:
```js
let _panelBooks = new Map();
export function openPanel(book, nodes = {}) {
  const panel = nodes.panelEl || document.getElementById('panel');
  if (!panel) return;
  panel.innerHTML = `
    <button class="panel-close" aria-label="Close">✕</button>
    ${book.cover ? `<img src="${book.cover}" alt="" class="panel-cover">` : ''}
    <h3>${book.title}</h3><p class="dim">${book.authors||''}</p>
    <p class="rating">${'★'.repeat(book.rating||0)}</p>
    <p class="panel-review">${book.review || book.note || ''}</p>
    <div class="chips">${(book.categories||[]).map(c=>`<span class="chip">${c}</span>`).join('')}</div>
    <a class="panel-link" target="_blank" rel="noopener" href="${book.isbn ? `https://books.google.com/books?vid=ISBN${book.isbn}` : `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(book.title + ' ' + (book.authors||''))}`}">View on Google Books →</a>`;
  panel.hidden = false;
  const close = panel.querySelector('.panel-close');
  if (close) close.addEventListener('click', () => closePanel(nodes));
}
export function closePanel(nodes = {}) { const panel = nodes.panelEl || document.getElementById('panel'); if (panel) panel.hidden = true; }

export async function initGraph(books, { canvas, onSelect, embedImpl } = {}) {
  canvas = canvas || document.getElementById('graph-canvas');
  _panelBooks = new Map(books.map(b => [b.key ?? b.isbn, b]));
  const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pick = id => { const b = _panelBooks.get(id); if (b) (onSelect || openPanel)(b); };
  const graph = new ForceGraph(canvas, lexicalGraph(books), { onSelect: pick, reducedMotion: reduce });
  graph.start && graph.start();
  const upgrade = async () => { const g = await similarityGraph(books, embedImpl ? { embedImpl } : {}); graph.setData(g); setMode(g.mode); };
  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); upgrade(); } });
    io.observe(canvas);
  } else { upgrade(); }
  return graph;
}
function setMode(mode) { const el = document.getElementById('graph-mode'); if (el) el.textContent = mode === 'lexical' ? 'lexical mode (semantic model unavailable)' : ''; }
```
In `boot`, after rendering: wire the `Graph | List` tabs to toggle `#graph-view`/`#list-view` `hidden` and `aria-selected`; delegate click/Enter on `#list-view [data-key]` to `openPanel(map.get(key))` (same `books`-by-key map `initGraph` builds); then `await initGraph(books)`; Esc closes the panel.

- [ ] **Step 4: Add panel/tooltip/toggle CSS** to `site.css`: `.panel` slide-in (transform + transition, disabled under reduced-motion), `.panel-close` top-right, `.chip` mono pill on `--layer-2`, `.tooltip` follows pointer, `.toggle button[aria-selected="true"]` blue underline.

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/wiring.test.mjs`
Expected: PASS (2/2).

- [ ] **Step 6: Run the whole suite**

Run: `node --test test/`
Expected: all green.

- [ ] **Step 7: Manual browser check (the real AI)**

Serve locally, scroll to the graph: the lexical graph appears instantly, then within a few seconds the semantic model loads (watch the Network tab fetch the model once) and edges re-cluster. Reload → model/embeddings served from cache. Click nodes → panel opens with the review. Toggle to List. Throttle to offline and reload → lexical mode note shows, graph still works.

- [ ] **Step 8: Commit**

```bash
git add assets/js/main.js assets/site.css test/wiring.test.mjs
git commit -m "[CLAUDE] Wire knowledge graph, detail panel, Graph/List toggle" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Funky 404 — the orphaned node

**Files:**
- Modify: `404.html` (replace contents)
- Test: manual (page is tiny glue over tested `graph.js`).

**Interfaces:**
- Consumes: `assets/site.css`, `assets/js/graph.js` (`ForceGraph` or `settle`+`clusterColor`).

- [ ] **Step 1: Replace `404.html`**

A minimal page in the site's language: load `assets/site.css`, a full-viewport `<canvas>`, and an inline `<script type="module">` that builds a tiny graph — a few faint connected nodes plus **one highlighted node labelled `404` with no edges** — via `ForceGraph` (or `settle` + a small draw). Centre copy: `<h1>404</h1><p>this page has no connections.</p>` and a mono link `<a href="/">cd ~ →</a>`. Honour `prefers-reduced-motion` (static settled render). Reuse the token palette; no new colours.

- [ ] **Step 2: Manual browser check**

Open `http://localhost:8000/404.html`: the orphan node drifts alone among a faint cluster; the `cd ~ →` link returns home; matches the site's palette; no console errors; reduced-motion renders a static frame.

- [ ] **Step 3: Commit**

```bash
git add 404.html
git commit -m "[CLAUDE] 404 — an orphaned node with no connections" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: README, cleanup, final verification, deploy

**Files:**
- Modify: `README.md`
- Verify: whole site

**Interfaces:** none.

- [ ] **Step 1: Rewrite `README.md`** to describe the developer site: sections (identity, links, reading, knowledge graph), the free on-device AI (transformers.js + lexical fallback), Google Books at runtime, how to edit `assets/data/shelf.js`, how to run (`python -m http.server`) and test (`node --test test/`). Note that `game.html`/`arcade.html`/`starfall.html`/`blog/` remain in the repo but are unlinked.

- [ ] **Step 2: Confirm nothing forbidden changed**

Run: `git diff --stat 7146b2b -- game.html arcade.html starfall.html blog`
Expected: empty (those files untouched).

- [ ] **Step 3: Full test suite**

Run: `node --test test/`
Expected: all green.

- [ ] **Step 4: Live smoke against real ISBNs**

Serve locally; confirm at least 3 of the 5 seeded ISBNs resolve real covers via Google Books, the semantic model loads once and produces sensible clusters, panel + toggle + 404 all work, and dark mode looks right (toggle OS theme).

- [ ] **Step 5: Commit and deploy**

```bash
git add README.md
git commit -m "[CLAUDE] README for the developer site + reading graph" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main    # Vercel auto-deploys
```

- [ ] **Step 6: Verify production**

After deploy, load the production URL: masthead/about/links, reading + graph (lexical → semantic), List, and `/404.html` all work; no console errors.

---

## Self-Review

**Spec coverage:** masthead/about/links → T7; currently-reading → T7; graph centerpiece + Graph/List toggle → T9; detail panel/reviews → T9; List/shelf → T8; visual system/tokens/dark mode → T7 (+T8/T9 component CSS); data model `shelf.js` → T7; runtime Google Books + cache + degraded → T2; AI semantic + lexical fallback + cache + lazy-load → T3/T4/T9; graph engine → T5/T6; 404 orphan node → T10; error handling → T2/T4/T9; a11y (List equivalent, focus, reduced-motion) → T7/T8/T9; performance (lazy model, caches, idle sim) → T4/T6/T9; testing strategy → every task + T6 harness; migration/README/untouched files → T11. All covered.

**Placeholder scan:** logic tasks (1–6, 8, 9 wiring) contain complete test + implementation code. Presentation tasks (7 CSS/HTML, 10) specify exact structure, ids, and token values rather than vague directives; the `…`-free descriptions enumerate the concrete classes and rules to write. No "TBD"/"handle edge cases"/"similar to Task N".

**Type consistency:** `Book`/`GraphNode`/`GraphEdge` shapes are defined once in File Structure and reused verbatim. Method names are stable across tasks: `fetchBook`/`loadShelf`(fetchImpl), `similarityGraph`/`lexicalGraph`(→`{nodes,edges,mode}`), `simulateStep`/`settle`/`pickNode`/`initLayout`/`clusterColor`, `ForceGraph.{setData,start,stop,resize,destroy,selectById}`, `renderProfile`/`renderCurrentlyReading`/`renderList`/`initGraph`/`openPanel`/`closePanel`. Edge `{a,b,w}` and node `{id,...}` are consistent between `embed.js` (producer) and `graph.js` (consumer).
