# Portfolio Cinematic Redesign

**Date:** 2026-05-31  
**Status:** Approved  
**Approach:** Hybrid — Scroll Spine + Branching Nodes  
**Narrative:** World-Building Arc  
**Audience:** Everyone (personal brand — memorability above all)

---

## Overview

Transform the existing vibecoded neural portfolio into a cinematic, scroll-driven experience where the brain canvas is the persistent world and each section is a distinct scene. Users follow a guided narrative spine (scroll) but can branch into deeper content via interactive nodes. The site must mesmerize — not just impress.

**Stack:** Pure HTML/CSS/JS (no framework, no bundler). All new code extends the existing `index.html` and its embedded scripts. The brain canvas (`<canvas id="brain">`) and cursor trail canvas remain as the foundation.

---

## Scene Structure

The site restructures into 5 full-screen scenes. The brain canvas persists throughout all scenes, morphing its glow color as the user scrolls.

### Scene 0 — AWAKENING (Entry / Hero)
**Color:** `#00e5ff` Electric Cyan  
**What it is:** Rebuilt version of the current hero.

- On load, the brain canvas runs a "boot sequence": neurons fire one-by-one outward from the center over ~2s, as if the network is initializing
- A cinematic text sequence overlays the canvas: `INITIALIZING NEURAL NETWORK...` fades in (monospace, letter-spaced), then dissolves into the name + tagline
- The current HUD stats panel remains but appears after the boot sequence completes (~2.5s)
- Scroll indicator: a pulsing cyan synapse dot (replaces the current vertical line hint)
- The existing thought-tag pills around the brain remain; they appear during boot sequence staggered

### Scene 1 — THE MIND (About)
**Color:** `#a855f7` Deep Purple  
**What it is:** Elevated version of the existing about section.

- As this scene enters the viewport, canvas neurons interpolate from cyan to purple over ~800ms
- The existing word-by-word scroll-reveal of the about statement is kept
- The 3-column stat grid (3+ years, LLM expertise, Nepal focus) becomes "neural fact nodes" — each card gets a purple glow border that activates on scroll-in, staggered by 150ms
- A branching node CTA appears below: `→ JUMP TO THE WORK` — clicking scrolls directly to Scene 3

### Scene 2 — THE MISSION (New)
**Color:** `#ff2d78` Hot Pink  
**What it is:** New full-screen manifesto section. Does not exist currently.

- Full-screen, minimal. No sidebar, no grid — just large display text
- Opening line in massive Orbitron display type (clamp 48px–96px): **"Nepal's next decade won't be built on imported models."**
- Secondary paragraph types on as the user scrolls into view (character-by-character, ~30ms/char): a 2–3 sentence expansion of the thesis about Nepal's fintech + LLM opportunity
- Canvas background: hot pink neuron glow, slightly lower density than hero — feels like a single focused thought
- No interaction, no branches — this scene is a statement, not an invitation

### Scene 3 — THE WORK (New)
**Color:** `#f59e0b` Amber Gold  
**What it is:** New featured content section with branching node UI.

- 3-column card grid. Initial cards:
  1. **THOUGHT** — "Why Nepal's Fintech Needs Its Own LLMs" (existing article)
  2. **EXPERIENCE** — Synapse Game (links to `game.html`)
  3. **COMING SOON** — locked node placeholder (faint, non-interactive)
- **Card hover state:** border glows amber, a pulsing synapse dot appears top-right, `EXPLORE NODE →` label animates in
- **Card click (for THOUGHT card):** a side panel slides in from the right (320px wide, backdrop-blur glassmorphism). Panel contains: article title, excerpt (~40 words), tag pills, `READ FULL ARTICLE →` CTA, and an `✕` close button. No page navigation — the panel overlays the scene
- **Card click (for EXPERIENCE card):** navigates to `game.html` (full page, new tab)
- Panel open/close is animated: slide-in 300ms ease-out, slide-out 200ms ease-in
- When a panel is open, background cards dim to 40% opacity

### Scene 4 — THE SIGNAL (Contact)
**Color:** Cyan `#00e5ff` + Purple `#a855f7` burst  
**What it is:** Rebuilt version of the existing contact section.

- As this scene enters, the brain canvas fires a single massive synapse burst across the full canvas (all neurons light up simultaneously, then fade over 1.5s) — the climactic moment
- One opening line in display type: **"The network is open."**
- The existing 4 contact nodes appear one-by-one with 200ms stagger, each with an individual glow pulse on entry
- Each contact item retains its color-coded hover state from the current implementation

---

## Persistent Systems

### Canvas Color Interpolation
- An `IntersectionObserver` (threshold: 0.4) watches each scene section
- When a scene crosses the threshold, the canvas smoothly interpolates its neuron glow color from the current color to the target scene color over 800ms using `requestAnimationFrame`
- A CSS custom property `--scene-accent` updates simultaneously on `<html>`, driving border colors, text accents, and glow effects across all UI elements in sync with the canvas
- Color targets per scene: `{ 0: '#00e5ff', 1: '#a855f7', 2: '#ff2d78', 3: '#f59e0b', 4: '#00e5ff' }`

### Scroll Behavior
- Each scene section is `min-height: 100vh`, `display: flex`, `align-items: center`
- No scroll-jacking or `scroll-snap` — native scroll is preserved for accessibility and performance
- Cinematic reveals use `IntersectionObserver` + CSS transitions (`opacity`, `translateY`) on child elements, not scroll position math

### Branching Node Side Panel
- A single `<div id="node-panel">` element lives outside the scene grid, position fixed right
- JavaScript swaps content into the panel and toggles a `.open` class
- Close on: ✕ click, Escape key, clicking outside the panel
- The panel does not exist in Scene 0, 1, 2, or 4 — it is only activated by Scene 3 cards

---

## What Is NOT Changing

- Custom cursor (dot + ring) — untouched
- Command palette (Cmd+K) — untouched  
- Toast notification system — untouched
- HUD stats panel — untouched (stays in Scene 0)
- `game.html` and `404.html` — untouched
- `thoughts/` blog entries — untouched
- Font stack (Orbitron, JetBrains Mono, Inter) — untouched
- Base color palette (`#030309` bg, `#07071a` bg2, `#c8d8ff` text) — untouched

---

## Files Changed

| File | Change |
|------|--------|
| `index.html` | Primary target — all 5 scenes, canvas interpolation, side panel |
| No new files | All changes in-place |

---

## Success Criteria

- First-time visitor says "wow" within 3 seconds of landing
- The boot sequence plays exactly once per visit (not on every scroll)
- Canvas color shift is smooth — no visible jump between scenes
- The side panel feels fast (opens in <300ms)
- Works on mobile (canvas scales, side panel becomes a full-width bottom sheet sliding up from the bottom edge)
- No layout shift during load
