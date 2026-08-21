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

import { getJSON, setJSON } from './storage.js';

const EMB_KEY = 'emb:minilm:';
// Per-embedder in-memory cache: WeakMap<embedImpl, Map<bookKey, vector>>
// This isolates caches between different embedImpl references (e.g. in tests)
// while still persisting within a single embedder's lifetime.
const _embedCache = new WeakMap();

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
    // Per-embedder in-memory cache (isolates test embedders from each other).
    // Only the real defaultEmbedder also reads/writes persistent storage.
    if (!_embedCache.has(embedImpl)) _embedCache.set(embedImpl, new Map());
    const localCache = _embedCache.get(embedImpl);
    const usePersist = embedImpl === defaultEmbedder;
    const need = [], needIdx = [];
    const vectors = books.map((b, i) => {
      const key = EMB_KEY + bookId(b);
      if (localCache.has(key)) return localCache.get(key);
      if (usePersist) {
        const cached = getJSON(key);
        if (cached) { localCache.set(key, cached); return cached; }
      }
      need.push(bookText(b)); needIdx.push(i); return null;
    });
    if (need.length) {
      const fresh = await embedImpl(need);
      if (!fresh || fresh.length !== need.length) throw new Error('bad embedder output');
      fresh.forEach((vec, j) => {
        const i = needIdx[j];
        const key = EMB_KEY + bookId(books[i]);
        vectors[i] = vec;
        localCache.set(key, vec);
        if (usePersist) setJSON(key, vec);
      });
    }
    const edges = topKEdges(ids, vectors, { k, threshold });
    const clusters = labelProp(ids, edges);
    const nodes = books.map(b => ({ id: bookId(b), label: b.title, authors: b.authors, r: nodeRadius(b), cluster: clusters.get(bookId(b)), status: b.status }));
    return { nodes, edges, mode: 'semantic' };
  } catch {
    return { ...lexicalGraph(books, { k }), mode: 'lexical' };
  }
}
