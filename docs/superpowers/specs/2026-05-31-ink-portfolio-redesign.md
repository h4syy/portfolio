# Ink Portfolio Redesign

**Date:** 2026-05-31
**Status:** Approved

---

## Overview

Complete rebuild of `index.html` as a print/ink editorial portfolio. Remove all canvas-based elements (brain, spine, cursor trail) and replace with a typographic, text-first design. The site reads like a beautifully typeset book — off-white paper, dark ink, one crimson accent, chapter-based scroll.

**Performance target:** < 1 second load on Vercel free tier. Zero canvas elements. ~50 lines of JS total.

---

## Visual Design System

### Colors
| Token | Value | Use |
|-------|-------|-----|
| `--paper` | `#f5f2eb` | Page background |
| `--ink` | `#1a1a1a` | Primary text, borders |
| `--ink-soft` | `#555` | Body text |
| `--ink-muted` | `#999` | Labels, metadata |
| `--ink-faint` | `#d8d4cc` | Dividers, rules |
| `--crimson` | `#c0392b` | Accent — chapter numbers, key words, progress bar |
| `--paper-warm` | `#eee8da` | Subtle callout backgrounds |

### Typography
| Role | Font | Weight | Style |
|------|------|--------|-------|
| Headlines | Libre Baskerville | 700 | Italic |
| Body | Libre Baskerville | 400 | Normal |
| Labels / UI | Courier Prime | 400 | Normal or Italic |
| Numbers | Courier Prime | 400 | Normal |

Google Fonts load: `Libre+Baskerville:ital,wght@0,400;0,700;1,400;1,700` + `Courier+Prime:ital@0;1`

### Spacing
4px base unit. Sections use `padding: clamp(3rem, 8vw, 5rem)`.

---

## Page Structure

Single `index.html`. Five `<section>` elements with `scroll-snap-align: start`, stacked vertically. The viewport snaps to each chapter on scroll. A fixed side-rail and progress bar persist across all chapters.

```
body
├── #progress-rail        (fixed right — 2px crimson fill)
├── #chapter-label        (fixed left — rotated chapter name)
├── nav                   (fixed top — minimal: name + play link)
├── #chapter-00 .cover
├── #chapter-01 .about
├── #chapter-02 .mission
├── #chapter-03 .work
├── #chapter-04 .signal
└── #cmd-overlay          (existing command palette, kept)
```

**No footer.** Contact (Chapter 04) is the last thing seen.

---

## Chapter Specifications

### Chapter 00 — Cover
Full-screen. Centered vertically. Three zones stacked:

**Top bar** (Courier Prime, 10px, letter-spaced):
- Left: `YASH PAUDEL`
- Right: `NEPAL · 2026`
- Separated from main content by a 1px `--ink-faint` rule

**Main:**
- Small crimson label: `AI RESEARCHER · BUILDER` (Courier Prime, 9px, 4px letter-spacing)
- Headline: `I build models / that speak Nepali.` — Libre Baskerville italic 700, `clamp(40px, 7vw, 80px)`, `"Nepali."` in crimson
- Subtitle line: `FINE-TUNING · EVAL PIPELINES · PRODUCTION AI` (Courier Prime, 9px, 2px letter-spacing, `--ink-muted`)

**Bottom bar:**
- Left: tags `LLM · FINTECH · NEPAL` (Courier Prime, 9px, `--ink-muted`)
- Right: `READ ↓` in crimson

**Ink reveal:** The headline words wipe in left-to-right on page load (not on scroll — this is the one exception). Delay: 300ms after DOMContentLoaded. Each word: 400ms wipe duration, 60ms stagger between words.

### Chapter 01 — The Mind
Full-screen. Content left-aligned, max-width 680px, centered on page.

- Chapter number: `01 · THE MIND` (Courier Prime, 9px, crimson, 4px letter-spacing)
- Headline: `I work at the edge of / what AI can actually do.` — Libre Baskerville italic 700, `clamp(28px, 4vw, 48px)`
- Body paragraph: existing about text, Libre Baskerville 400, 18px, `--ink-soft`, line-height 1.85, max-width 560px
- Stat grid: 3-column, 1px `--ink-faint` gaps between cells, `--paper` background. Each cell: large Libre Baskerville number (28px) + Courier Prime label below (8px, letter-spaced). Values: `3+` / `LLM` / `NP`

**Ink reveal:** Each element wipes in sequentially on scroll-in (IntersectionObserver threshold 0.3). Order: chapter label → headline line 1 → headline line 2 → body → stat grid (cells stagger 40ms).

### Chapter 02 — The Mission
Full-screen. Centered. Minimal — this chapter is a statement, not a list.

- Chapter number: `02 · THE MISSION` (Courier Prime, 9px, crimson)
- Headline: `Nepal's next decade / won't be built on / imported models.` — Libre Baskerville italic 700, `clamp(32px, 5vw, 64px)`, full crimson color
- Body: 2 sentences. Libre Baskerville 400, 16px, `--ink-soft`, max-width 520px, line-height 1.9
- A 32px horizontal crimson rule (2px height) separates chapter number from headline

**Ink reveal:** Headline wipes in line-by-line. Body follows after headline completes.

### Chapter 03 — The Work
Full-screen. Content left-aligned, max-width 680px.

- Chapter number: `03 · THE WORK` (Courier Prime, 9px, crimson)
- Entry list — each entry is a row:
  - Left: entry number in crimson Courier Prime (`01`, `02`, `03`)
  - Right: title in Libre Baskerville 700 15px + metadata in Courier Prime 9px `--ink-muted`
  - Separated by 1px `--ink-faint` top border
  - Full row is an `<a>` tag
- Entries:
  1. "Why Nepal's Fintech Needs Its Own LLMs" → `blog/why-nepal-needs-its-own-llms.html` · ESSAY · APRIL 2026 · 6 MIN
  2. "Synapse — Neural Network Game" → `game.html` · EXPERIENCE · CANVAS · INTERACTIVE
  3. "Next piece forthcoming..." → `#` (disabled, opacity 0.35) · IN PROGRESS

**Ink reveal:** Entries wipe in one-by-one, 80ms stagger.

### Chapter 04 — The Signal
Full-screen. Centered. Minimal.

- Chapter number: `04 · THE SIGNAL` (Courier Prime, 9px, crimson)
- Headline: `The network is open.` — Libre Baskerville italic 700, `clamp(32px, 5vw, 60px)`
- A 1px `--ink-faint` rule below the headline
- Contact grid: 2×2, 1px `--ink-faint` gaps. Each cell is a link (`<a>`):
  - Label: Courier Prime 9px `--ink-muted` (e.g., `PROFESSIONAL`)
  - Name: Libre Baskerville 400 18px `--ink-soft`, hover → `--ink`
  - Arrow: `↗` in `--ink-muted`, hover → crimson
  - Cells: LinkedIn (blue hover), GitHub (purple), Instagram (pink), Email (crimson)

**Ink reveal:** Headline → rule → grid cells (2 at a time, 60ms stagger).

---

## Persistent UI

### Progress Rail
```css
#progress-rail {
  position: fixed;
  right: 0; top: 0;
  width: 2px; height: 100%;
  background: --ink-faint;
  z-index: 100;
}
#progress-fill {
  width: 100%; height: 0%;
  background: --crimson;
  transition: height 0.1s ease;
}
```
JS: `scrollY / (document.body.scrollHeight - innerHeight) * 100` → set as `height%`.

### Chapter Label
```css
#chapter-label {
  position: fixed;
  left: 16px; top: 50%;
  transform: translateY(-50%) rotate(-90deg);
  transform-origin: center center;
  font-family: 'Courier Prime', monospace;
  font-size: 9px; letter-spacing: 4px;
  color: --ink-faint;
  z-index: 100;
  transition: opacity 0.3s ease;
  white-space: nowrap;
}
```
JS: IntersectionObserver updates text content to active chapter's `data-label` attribute.

### Nav
Fixed top. Minimal — just two items:
- Left: `YP` in Libre Baskerville 700, links to `#chapter-00`
- Right: `▸ PLAY` in Courier Prime, links to `game.html`
- Background: `rgba(245,242,235,0.9)`, `backdrop-filter: blur(8px)`, bottom border 1px `--ink-faint`

### Command Palette
Keep existing `#cmd-overlay` markup and JS verbatim. Update its colors to match the new palette (background `rgba(245,242,235,0.96)`, border `--ink-faint`, text `--ink`).

---

## Ink Wipe Reveal

**CSS:**
```css
.ink-reveal {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.ink-reveal.revealed {
  clip-path: inset(0 0% 0 0);
}
```

**JS:**
```js
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const els = Array.from(entry.target.querySelectorAll('.ink-reveal'));
    els.forEach((el, i) => {
      setTimeout(() => el.classList.add('revealed'), i * 40);
    });
    revealObs.unobserve(entry.target);
  });
}, { threshold: 0.3 });

document.querySelectorAll('section').forEach(s => revealObs.observe(s));
```

Cover headline exception: fires 300ms after `DOMContentLoaded`, words stagger 60ms each.

**Reduced motion:** `@media (prefers-reduced-motion: reduce)` → `.ink-reveal { clip-path: none; transition: none; }` — all content immediately visible.

---

## What Gets Removed

| Element | Reason |
|---------|--------|
| `#brainCanvas` | Replaced by typography |
| `#spineCanvas` | No longer needed |
| `#trailCanvas` | No cursor trail |
| `#cur-dot`, `#cur-ring` | Custom cursor removed |
| `#boot-overlay` | Boot sequence removed |
| `.hud`, `.toast-stack` | HUD removed |
| `.thought-tag` | Orbital tags removed |
| All scene JS | ~650 lines — removed |
| Perlin noise, KNN | Canvas math — removed |
| Boot sequence JS | Removed |
| Scene IntersectionObserver | Replaced by simpler reveal obs |

**Kept:** Command palette JS (verbatim), audio toggle (restyled), `game.html`, `404.html`, `blog/` directory.

---

## Files Changed

| File | Change |
|------|--------|
| `index.html` | Complete rewrite |

No new files created.

---

## Success Criteria

- Page loads in < 1 second (Vercel free tier, no canvas, no heavy JS)
- Ink wipe reveal fires correctly on each chapter scroll-in
- Progress rail tracks scroll position accurately
- Chapter label updates as reader moves through chapters
- Command palette still works
- Mobile: 375px — readable, no horizontal overflow, nav accessible
- `prefers-reduced-motion`: all content visible immediately, no animation
