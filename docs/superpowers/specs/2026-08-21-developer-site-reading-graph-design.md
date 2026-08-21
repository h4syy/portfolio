# Developer Site + Reading Knowledge Graph — Design

- **Date:** 2026-08-21
- **Status:** Draft for review
- **Author:** Yash Paudel (with Claude)

## Context

The current site is a playful editorial portfolio plus two canvas games and an arcade.
Yash wants to retire that identity and ship a mature, purely-professional developer site:
who he is, his links, his reading (currently-reading + reviews), and an **AI-derived
knowledge graph** showing how the books he studies relate — the graph as a deliberately
placed centerpiece, not a gimmick.

Constraints carried in from the existing project: static hosting on Vercel, no build step,
no server, no paid services, no secrets in the client.

## Goals

- A single, cohesive, professional page: identity, social links, reading, and the graph.
- The knowledge graph is the primary way to explore the shelf (node → review), with an
  accessible List view as its equal.
- The "AI element" is real and **free** — no paid API, no backend, no keys.
- Reading data is cheap to maintain: append one line per book.
- Good engineering at the code level: small, single-purpose, testable ES modules; graceful
  degradation; a11y; reduced-motion; mobile.

## Non-goals / out of scope

- No games, arcade, or blog in the new navigation. Those files remain in the repo (git
  history intact) but are unlinked; they are not deleted unless Yash later asks.
- No CMS, no auth, no comments, no analytics.
- No bundler, framework, or npm install step.

## Decisions (from brainstorming)

| Fork | Decision |
| --- | --- |
| Scope | Full replace. `index.html` is rebuilt from scratch; nothing carried over. |
| AI graph | On-device semantic embeddings (transformers.js), lexical fallback. $0. |
| Book data | Google Books API at runtime (free, keyless), driven by a local ISBN list. |
| Visual | Neutral system / Carbon-ish: greyscale + one blue, IBM Plex, strict grid. |
| 404 | New "orphaned node" page in the same visual language. |

## Information architecture

Single page, Carbon-style grid, top-to-bottom:

1. **Masthead** — name, role ("Software engineer · Nepal"), a one-line positioning
   statement, and social links (GitHub, LinkedIn, email; X optional). Sticky, minimal top bar.
2. **About** — 2–3 factual sentences (what he builds; AI/backend focus; from Nepal) and a
   few restrained stat tiles.
3. **Currently reading** — books with `status: 'reading'`, each with cover, title/author, a
   progress bar, and a one-line "why".
4. **The Graph** (centerpiece) — interactive knowledge graph with a `Graph | List` toggle.
   Clicking a node opens a detail panel (cover, rating, review, categories, related books,
   external link). The **List** toggle shows the same data as accessible cards.
5. **Shelf / Reviews** — the List view: all books grouped by status (Reading / Read / Want),
   cards with cover, rating, and short review.
6. **Footer** — colophon: "vanilla JS · Google Books · on-device embeddings", copyright.

The graph and the List are two renderings of one dataset. The List is the canonical
accessible fallback and the no-model / no-canvas path.

## Visual system

- **Type:** IBM Plex Sans (body/headings), IBM Plex Mono (labels, numbers, metadata, code).
  Loaded from Google Fonts.
- **Tokens (CSS custom properties):**
  - Light: `--bg #f4f4f4`, `--layer #ffffff`, `--layer-2 #ededed`, `--text #161616`,
    `--dim #6f6f6f`, `--line #e0e0e0`, `--blue #4589ff`.
  - Dark (via `prefers-color-scheme: dark`): `--bg #161616`, `--layer #262626`,
    `--layer-2 #393939`, `--text #f4f4f4`, `--dim #a8a8a8`, `--line #393939`,
    `--blue #78a9ff`.
  - Graph cluster palette: a small set of desaturated hues (e.g. blue, teal, amber, violet,
    rose) chosen to read on both themes; assigned per emergent cluster.
- **Layout:** 4 / 8 / 16 / 24 px spacing scale, hairline `--line` dividers, 2px `--blue`
  focus rings, tight grid columns. Motion only where it earns it; respects
  `prefers-reduced-motion`.

## Data model — `assets/data/shelf.js`

Single source of truth Yash maintains, **title-first** (he thinks in titles, not ISBNs).
Google Books is queried by title (+author); an optional `isbn` overrides the lookup. Each
book's stable id is `key = isbn || slug(title)`.

```js
export const profile = {
  name: 'Yash Paudel',
  role: 'Software engineer · Nepal',
  tagline: '…one line…',
  links: { github: 'https://github.com/h4syy', linkedin: '…', email: 'mailto:…' },
  about: '…2–3 sentences…',
};

export const shelf = [
  // status: 'reading' | 'read' | 'want'
  { isbn: '9781449373320', status: 'reading', progress: 0.62, started: '2026-08',
    note: 'the mental model I keep coming back to', tags: ['data-systems'] },
  { isbn: '…', status: 'read', rating: 5, finished: '2026-07', review: 'one or two sentences' },
  { isbn: '…', status: 'want' },
];
```

Optional fields per entry: `rating` (1–5), `review` / `note` (string), `progress` (0–1),
`started` / `finished` (YYYY-MM), `tags` (string[]; seed hints for the lexical fallback).

## Runtime data flow

1. `main.js` imports `shelf`, renders masthead/about/currently-reading immediately from
   local fields (no network needed for structure).
2. For each ISBN, `books.js` resolves metadata via Google Books
   (`https://www.googleapis.com/books/v1/volumes?q=isbn:<isbn>`), keyless. Results are
   cached in `localStorage` (`books:v1:<isbn>`) so repeat visits are instant and offline-tolerant.
3. Cards and graph nodes render as metadata resolves. Covers use the Google Books thumbnail;
   on failure, a generated monogram placeholder (title initials on a `--layer-2` tile).

## AI relatedness — `embed.js`

**Primary (semantic):** lazy-import `transformers.js` from a CDN
(`@huggingface/transformers`), model `Xenova/all-MiniLM-L6-v2`, feature-extraction pipeline,
mean-pooled + normalized → 384-dim vector per book from `title + authors + description`.
Vectors cached in `localStorage` (`emb:minilm:<isbn>`) so each book embeds exactly once, ever.
Similarity = cosine; edges = each node's top-k neighbours (k = 3) above a threshold (~0.35),
deduplicated and undirected.

**Fallback (lexical):** TF-IDF over `title + authors + categories + tags`, cosine similarity,
same top-k edge construction. Produces an identical `{nodes, edges}` shape. Used (a) for the
instant first paint before the model loads, and (b) whenever the model can't load (offline,
blocked CDN, no WASM/WebGPU). A small "lexical mode" note appears in that case.

**Clustering:** label-propagation over the kNN graph (cheap, dependency-free) assigns each
node a community id → cluster colour. No external clustering lib.

**Lazy loading:** the model is fetched only when the graph section enters the viewport
(IntersectionObserver) or on an explicit "reveal connections" affordance, so the ~23 MB
download never blocks initial render.

### `embed.js` interface

```
similarityGraph(books, opts?) -> Promise<{ nodes, edges }>   // semantic; falls back internally
lexicalGraph(books, opts?)   -> { nodes, edges }             // synchronous, no model
// node: { id, label, authors, r, cluster, status }
// edge: { a, b, w }   (w in 0..1)
```

## Graph engine — `graph.js`

- `class ForceGraph(canvas, { nodes, edges }, opts)`.
- Hand-written force simulation: pairwise repulsion (brute force O(n²) — fine for a personal
  shelf, expected < ~100 nodes), spring attraction along edges, mild centering gravity,
  velocity damping. No d3 / vis.js.
- DPR-aware canvas; resize-aware. Node radius from rating/pageCount; colour from cluster;
  `status: 'reading'` nodes pulse subtly.
- Interaction: hover → tooltip (title/author); click/tap → `onSelect(isbn)`; drag to pan a
  node; pinch/drag canvas on touch. Larger hit radius on coarse pointers.
- Settles to low energy then idles (no wasted frames). `prefers-reduced-motion` → compute a
  settled layout synchronously and render once, statically.
- No DOM or network coupling: constructed with data, emits selection via callback.

## Detail panel

Opened from a graph node or a card. Shows cover, title, authors, star rating, status,
review/note, category chips, related titles (its graph neighbours), and a "View on Google
Books" link. Dismissible; focus-trapped when open; Esc closes.

## 404 — `404.html`

Same visual language. A minimal `ForceGraph` (or a static settled render) of a few faint,
connected nodes plus **one highlighted, edge-less node labelled `404` drifting alone** —
copy: "this page has no connections." A mono `cd ~ →` link returns home. Reuses `site.css`
tokens and, where trivial, `graph.js`.

## Module architecture

Native ES modules (`<script type="module">`), no bundler; works as-is on static Vercel.

```
index.html            new developer site (structure only; logic in modules)
404.html              orphaned-node page
assets/
  site.css            design tokens + layout + components (light/dark)
  js/
    main.js           orchestration: load → render → graph → wire panel/toggle
    books.js          fetchBook(isbn) -> Book; loadShelf(shelf) -> Book[]; localStorage cache; fallbacks
    embed.js          similarityGraph()/lexicalGraph(); embedding + cache + clustering
    graph.js          ForceGraph class: sim + canvas render + interaction; onSelect callback
  data/
    shelf.js          profile + shelf (source of truth)
```

Each module has one responsibility and a small, documented interface. `graph.js` and
`embed.js` are pure of DOM/fetch so they can be unit-tested headlessly.

## Error handling

- Google Books failure / rate-limit → fall back to any local `title`/`author` (else the raw
  ISBN), monogram cover, entry flagged `degraded`. Cached results avoid re-hitting the API.
- Embedding model failure → lexical graph, with a small non-blocking "lexical mode" note.
- `localStorage` unavailable/full → run in-memory; never throw to the user.
- No JavaScript → masthead + about render from static HTML; a `<noscript>` note explains the
  shelf/graph need JS. (A personal dev site may assume JS; this is a courtesy floor.)

## Accessibility

- Semantic landmarks (`header`, `main`, `section`, `nav`, `footer`), heading order, labelled
  controls, visible 2px focus rings.
- The **List** view is a fully keyboard/screen-reader accessible equivalent of the graph;
  the `Graph | List` toggle is a real control, List available even if canvas/model fail.
- Respect `prefers-reduced-motion` (static graph, no pulse/auto-animation).
- Colour is never the only signal (labels + shape accompany cluster colour).

## Performance

- Structure paints before any network. Metadata and graph fill in progressively.
- Model lazy-loaded on graph visibility only; embeddings and book metadata cached in
  `localStorage` keyed by ISBN (compute/fetch once per book, ever).
- Force sim idles when settled; canvas is DPR-capped; brute-force forces are fine at this scale.

## Testing

Reuse the headless-stub harness pattern already used for the game (`node` + stubbed
DOM/canvas/`localStorage`):

- `embed.js`: `similarityGraph`/`lexicalGraph` on fixture books return well-formed,
  non-NaN `{nodes, edges}`; edges reference existing nodes; deterministic given fixed input.
- `graph.js`: constructing and ticking `ForceGraph` on a fixture never produces NaN
  positions and settles; hit-testing returns the expected node.
- `books.js`: cache round-trips; fetch failure yields a degraded-but-valid `Book`.
- Live check: resolve 2–3 real ISBNs against Google Books before shipping; confirm the model
  loads and produces sensible neighbours in a browser.

## File structure & migration

- **New:** `index.html`, `404.html` (rewritten), `assets/site.css`, `assets/js/{main,books,embed,graph}.js`,
  `assets/data/shelf.js`.
- **Rewritten:** `README.md` (describe the developer site + reading graph; drop game marketing).
- **Untouched, unlinked, retained:** `game.html`, `arcade.html`, `starfall.html`, `blog/`.
  Deleted only on explicit request.

## Open questions (resolved)

- Starting book list — **provided** (2026-08-21): 7 currently-reading, 13 finished, seeded
  title-first into `shelf.js`; Yash edits ratings/reviews after. Data is title-first, so the
  layer queries Google Books by title/author rather than ISBN.
- Surfacing the existing blog essay under a "Writing" link — deferred, not in scope.
