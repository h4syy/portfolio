# yashpaudel.com.np

Personal site of **Yash Paudel** — software engineer, Nepal. Static HTML, no build step,
no framework. Deploys on Vercel.

---

## What this site is

A developer identity page centred on a **reading knowledge graph**. Open the site and you
get:

| Section | What it is |
| --- | --- |
| **Masthead / About** | Name, role, tagline, and links (GitHub, LinkedIn, e-mail). |
| **Currently Reading** | Auto-populated shelf of books whose status is `'reading'` in `shelf.js`. Covers are fetched at runtime from Google Books. |
| **Knowledge Graph** | A force-directed canvas graph — every book is a node; edges connect books that share ideas (semantic similarity from on-device AI, or TF-IDF when the model is not yet loaded). Click any node to open a detail panel with the review. |
| **List view** | A card grid grouped by status (Reading → Read → Want to read). Toggle between Graph and List with the button in the toolbar. |

---

## The AI — free, on-device, no keys, no backend

Edges in the graph are computed entirely in the browser using
[Transformers.js](https://xenova.github.io/transformers.js/) running
`Xenova/all-MiniLM-L6-v2` (a ~23 MB WASM model). This costs **$0**, requires no API keys,
and sends zero data to a server.

- **First load:** the model is lazy-loaded in the background while lexical TF-IDF edges
  are shown immediately as a fallback.
- **After load:** the graph upgrades to semantic cosine-similarity edges in place.
- **Subsequent loads:** embedding vectors are cached in `localStorage` keyed by book ISBN /
  title slug. The model is not downloaded again.

If `localStorage` is unavailable (private browsing, storage quota) the module falls back
to an in-memory cache for the session.

---

## Book data — `assets/data/shelf.js`

Add, edit, or remove books by editing the `shelf` array in `assets/data/shelf.js`. Entries
are title-first; ISBN is optional (the lookup falls back to a `title + author` search
against Google Books when no ISBN is present).

```js
// Minimal entry — Google Books will fill in cover, description, etc.
{ title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', status: 'reading', tags: ['distributed-systems', 'databases'] }

// With ISBN — guarantees the exact edition is fetched
{ title: 'Meditations', author: 'Marcus Aurelius', isbn: '9780140449334', status: 'read', rating: 5, review: 'A field manual for staying rational under pressure.', tags: ['philosophy', 'stoicism'] }
```

Valid fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | yes | Used as the graph node label and the Google Books search key. |
| `author` | string | yes | Included in the search query. |
| `isbn` | string | no | If present, searches by ISBN instead of title+author. |
| `status` | `'reading' \| 'read' \| 'want'` | yes | Controls which section the book appears in. |
| `rating` | 1–5 | no | Shown as filled stars in the detail panel and List view. |
| `review` | string | no | Free-text shown in the detail panel. |
| `tags` | string[] | no | Used for TF-IDF lexical similarity. |
| `finished` | string | no | Date string shown in the detail panel. |

Google Books covers are fetched at runtime and cached in `localStorage`. If the API is
unreachable the book card degrades gracefully (monogram placeholder, title only).

---

## Run locally

```bash
python -m http.server 8000
# then open http://localhost:8000
```

No build or install step needed for the site itself.

---

## Tests

```bash
npm install   # installs the test-only devDeps (Node built-ins, no bundler)
node --test test/*.mjs
```

> **Note:** `node --test test/` is broken on Node 22 — always pass the glob `test/*.mjs`.

The suite covers: `storage.js` persistence + fallback, `books.js` Google Books fetch +
cache + degraded mode, `embed.js` lexical TF-IDF + semantic similarity + cache + fallback,
`graph.js` force simulation + canvas renderer + node picking, `main.js` wiring
(renderProfile, renderCurrentlyReading, initGraph, openPanel), and List view rendering.

---

## File structure

```
index.html              # the site — a single self-contained page
404.html                # orphaned-node page (rendered when Vercel can't find a route)
assets/
  data/
    shelf.js            # book data + profile (edit this)
  js/
    storage.js          # safe localStorage wrapper with in-memory fallback
    books.js            # Google Books API fetch, cache, degraded mode
    embed.js            # on-device embeddings (Transformers.js) + lexical TF-IDF fallback
    graph.js            # force simulation + ForceGraph canvas renderer
    main.js             # page wiring: masthead, reading strip, graph/list toggle, panel
test/
  *.mjs                 # Node --test suite (no browser needed)
```

---

## Notes on other files in the repo

`game.html`, `arcade.html`, `starfall.html`, and `blog/` remain in the repository for
history but are **not linked from the main site**. They are independent, self-contained
pages that can be loaded directly by URL.
