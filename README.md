# yashpaudel.com.np

Personal site of **Yash Paudel** — software engineer, Nepal. Static HTML, no build step,
no framework, no backend. Deploys on Vercel.

---

## Three sections (one page, nav-switched views)

The site is a single page with a top nav that switches between three distinct views:

| View | What it is | Data |
| --- | --- | --- |
| **Work** | Identity, About, Experience, and Selected work. | `assets/data/profile.js` |
| **FLUX** | The writing / blog index. Each post is a reskinned article under `/flux`. | `assets/data/posts.js` |
| **Reading** | Currently reading + a force-directed **knowledge graph** of how the books relate (click a node for the review) with a Graph/List toggle. | `assets/data/shelf.js` |

Navigation is hash-based (`#work` / `#flux` / `#reading`), so links and refreshes land on the
right view. The graph initialises lazily the first time Reading is opened.

---

## Editing content

- **Work** — edit `assets/data/profile.js`: `profile` (name/role/location/tagline/about/links),
  `experience[]`, and `projects[]`. Placeholders are marked — swap them for your real content.
- **FLUX** — add an entry to `assets/data/posts.js` and a matching HTML file under `flux/`
  (copy an existing post for the styling).
- **Reading** — edit the `shelf` array in `assets/data/shelf.js`. Entries are title-first;
  add an `isbn` to get a cover, plus optional `rating` / `review` / `finished` / `tags`.

---

## Book covers — Open Library, no API, no rate limits

Covers are direct **Open Library** cover-image URLs by ISBN
(`https://covers.openlibrary.org/b/isbn/<isbn>-M.jpg?default=false`), loaded by the browser
as plain `<img>`. There is **no JSON API call** to rate-limit — the previous Google Books
approach fired 20 concurrent requests and got 429'd. A book with no ISBN (or an unknown
cover) shows a monogram tile instead; the image simply removes itself on error.

## The AI — free, on-device, no keys, no backend

Graph edges are computed in the browser with [Transformers.js](https://xenova.github.io/transformers.js/)
running `Xenova/all-MiniLM-L6-v2` (~23 MB WASM model, lazy-loaded when the graph opens).
Costs **$0**, no API keys, no data leaves the device. A lexical TF-IDF graph paints instantly
and remains the fallback if the model can't load; embedding vectors are cached in `localStorage`.
Similarity is computed from each book's `title + author + tags` (which clusters cleanly).

---

## Run & test

```bash
python -m http.server 8000        # then open http://localhost:8000
node --test test/*.mjs            # NOTE: `node --test test/` is broken on Node 22 — use the glob
```

Tests cover `storage.js`, `books.js` (cover URLs + local mapping), `embed.js`
(lexical + semantic + cache + fallback), `graph.js` (force sim + canvas renderer + picking),
and `main.js` wiring (profile, currently-reading, list, graph, panel).

---

## File structure

```
index.html              # the three-view shell
404.html                # orphaned-node page
flux/                    # blog posts (Carbon-styled articles)
assets/
  site.css
  data/
    profile.js          # Work: identity + experience + projects
    posts.js            # FLUX: post index
    shelf.js            # Reading: book shelf
  js/
    storage.js  books.js  embed.js  graph.js  main.js
test/  *.mjs             # node --test suite (no browser needed)
```

`game.html`, `arcade.html`, `starfall.html`, and the old `blog/` essay remain in the repo but
are unlinked from the site.
