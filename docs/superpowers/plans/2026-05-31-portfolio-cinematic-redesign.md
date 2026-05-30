# Portfolio Cinematic Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing portfolio into a cinematic 5-scene experience with scroll-driven canvas color shifts, a boot sequence, two new sections (Mission + Work), and a branching node side panel.

**Architecture:** All changes live in a single `index.html`. A CSS custom property `--scene-accent` propagates the active scene color to all UI elements. An `IntersectionObserver` watches 5 scene sections and drives both canvas color interpolation and the CSS variable. Two new HTML sections (Mission, Work) are inserted between the existing about and contact sections. The existing thoughts section becomes Scene 3 (Work).

**Tech Stack:** Vanilla HTML5, CSS3, Canvas API, ES6 JS. No build step, no new dependencies, no new HTTP requests. All animations use `transform`/`opacity` only (GPU-composited). No images added — everything is CSS/Canvas/JS.

**Performance budget:** Zero new network requests. All panel content is JS-rendered strings. All animations in `requestAnimationFrame`. Passive scroll listeners. No layout thrashing.

**Scene colors:**
- Scene 0 AWAKENING: `#00e5ff` / `0,229,255`
- Scene 1 THE MIND: `#a855f7` / `168,85,247`
- Scene 2 THE MISSION: `#ff2d78` / `255,45,120`
- Scene 3 THE WORK: `#f59e0b` / `245,158,11`
- Scene 4 THE SIGNAL: `#00e5ff` / `0,229,255`

---

### Task 1: CSS Custom Property System

**Files:**
- Modify: `index.html` — CSS `<style>` block

- [ ] **Step 1: Add `--scene-accent` to `:root`**

In the `<style>` block, add or extend the `:root` selector at the top:

```css
:root {
  --scene-accent: #00e5ff;
  --scene-accent-rgb: 0, 229, 255;
  --scene-transition: color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease, background-color 0.5s ease;
}
```

- [ ] **Step 2: Add `.scene-label` utility class**

This class is used by all 5 scenes. Add once here:

```css
.scene-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.25em;
  color: var(--scene-accent);
  opacity: 0.6;
  margin-bottom: 1.5rem;
  transition: var(--scene-transition);
}
```

- [ ] **Step 3: Add transition to accent-colored elements**

Find these selectors in the existing CSS and add `transition: var(--scene-transition);` to each:
- `.hud-dot` (or equivalent pulsing status dot)
- Any `.section-label` or equivalent small-caps label elements
- Navigation link hover underlines

Do NOT touch contact item colors — they have individual per-item colors.

- [ ] **Step 4: Add `will-change` to animated elements**

```css
#node-panel { will-change: transform; }
#panel-backdrop { will-change: opacity; }
```

(These selectors don't exist yet — add them now as placeholders; CSS will apply once the elements exist in Task 9.)

- [ ] **Step 5: Verify**

Open `index.html` in browser. In DevTools console:
```js
document.documentElement.style.setProperty('--scene-accent', '#a855f7');
document.documentElement.style.setProperty('--scene-accent-rgb', '168, 85, 247');
```
Confirm any accent-colored elements shift to purple. Undo: `document.documentElement.style.removeProperty('--scene-accent')`.

- [ ] **Step 6: Commit**
```bash
git add index.html
git commit -m "feat: add --scene-accent CSS custom property system"
```

---

### Task 2: Scene HTML Structure

**Files:**
- Modify: `index.html` — HTML body

**BEFORE STARTING:** Read `index.html` to identify:
- The opening tag of the hero section
- The opening tag of the about section
- The opening tag of the thoughts/blog section
- The opening tag of the contact section
Record these so you can add `data-scene` attributes precisely.

- [ ] **Step 1: Tag hero section (Scene 0)**

Add to the hero section's opening tag:
```html
<section id="scene-0" data-scene="0" data-accent="#00e5ff" data-accent-rgb="0,229,255">
```

- [ ] **Step 2: Tag about section (Scene 1)**

```html
<section id="scene-1" data-scene="1" data-accent="#a855f7" data-accent-rgb="168,85,247">
```

Also wrap the hero name/tagline/identity block in:
```html
<div class="hero-identity" style="opacity:0;transition:opacity 0.8s ease 0.3s;">
  <!-- existing name + tagline content here -->
</div>
```
This div starts hidden and reveals after the boot sequence.

- [ ] **Step 3: Insert Mission section (Scene 2)**

After the closing `</section>` of the about section, insert:
```html
<section id="scene-2" data-scene="2" data-accent="#ff2d78" data-accent-rgb="255,45,120" class="scene-mission">
  <div class="mission-content">
    <div class="scene-label">02 / THE MISSION</div>
    <h2 class="mission-headline" aria-label="Mission statement">Nepal's next decade won't be built on imported models.</h2>
    <p class="mission-body" data-typewrite="Nepal's financial systems run on remittances, mobile-first infrastructure, and a dozen distinct languages. No model trained on Western data understands that. We build from here."></p>
  </div>
</section>
```

- [ ] **Step 4: Transform thoughts section into Scene 3 (Work)**

Change the thoughts section opening tag to:
```html
<section id="scene-3" data-scene="3" data-accent="#f59e0b" data-accent-rgb="245,158,11" class="scene-work">
```

Inside it, prepend:
```html
<div class="scene-label">03 / THE WORK</div>
```

The existing thoughts content will be replaced in Task 8.

- [ ] **Step 5: Tag contact section (Scene 4)**

```html
<section id="scene-4" data-scene="4" data-accent="#00e5ff" data-accent-rgb="0,229,255" class="scene-signal">
```

- [ ] **Step 6: Verify scene tags**

```js
document.querySelectorAll('[data-scene]').forEach(s =>
  console.log(s.id, s.dataset.accent)
);
```
Expected:
```
scene-0 #00e5ff
scene-1 #a855f7
scene-2 #ff2d78
scene-3 #f59e0b
scene-4 #00e5ff
```

- [ ] **Step 7: Commit**
```bash
git add index.html
git commit -m "feat: scene HTML structure with data-scene attributes"
```

---

### Task 3: IntersectionObserver + Canvas Color Lerp

**Files:**
- Modify: `index.html` — JS `<script>` block

**BEFORE STARTING:** Read the brain canvas JS section to find:
- The `requestAnimationFrame` loop function name
- The variable name for the neuron array (e.g., `neurons`, `nodes`, `points`)
- The canvas 2D context variable name (e.g., `ctx`, `context`)
- The color value used for neuron glow (e.g., `'#00e5ff'`, a variable named `glowColor`)
Record these names. All references in this task use `neurons` and `ctx` as placeholders — replace with actual names.

- [ ] **Step 1: Add color math helpers**

Near the top of the `<script>` block (before DOMContentLoaded), add:

```js
function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1,3), 16),
    parseInt(hex.slice(3,5), 16),
    parseInt(hex.slice(5,7), 16),
  ];
}

function lerpChannel(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function easeInOut(t) {
  return t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
}
```

- [ ] **Step 2: Add lerp state**

```js
let currentNeuronRgb = [0, 229, 255];
let lerpFromRgb = [0, 229, 255];
let lerpToRgb = [0, 229, 255];
let lerpStartMs = null;
const LERP_DURATION_MS = 500;

function setSceneColor(hexColor) {
  lerpFromRgb = [...currentNeuronRgb];
  lerpToRgb = hexToRgb(hexColor);
  lerpStartMs = null; // reset; will be set on next RAF tick
}

function tickColorLerp(nowMs) {
  if (!lerpStartMs) lerpStartMs = nowMs;
  const t = easeInOut(Math.min(1, (nowMs - lerpStartMs) / LERP_DURATION_MS));
  currentNeuronRgb = lerpFromRgb.map((c, i) => lerpChannel(c, lerpToRgb[i], t));
  return currentNeuronRgb;
}
```

- [ ] **Step 3: Hook lerp into the RAF draw loop**

In the existing RAF draw loop function (receives a `timestamp` / `now` argument), at the top of the function body, add:

```js
const [r, g, b] = tickColorLerp(timestamp); // use whatever the RAF arg is named
const accentColor = `rgb(${r},${g},${b})`;
const accentGlow = `rgba(${r},${g},${b},0.45)`;
```

Then find every hardcoded `'#00e5ff'` or `glowColor` value used in canvas draw calls for neuron/synapse glow and replace with `accentColor` or `accentGlow` as appropriate.

- [ ] **Step 4: Add IntersectionObserver**

After the canvas initialization code, add:

```js
let activeSceneIndex = 0;

const sceneObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const sceneNum = parseInt(entry.target.dataset.scene, 10);
    if (sceneNum === activeSceneIndex) return;
    activeSceneIndex = sceneNum;
    const accent = entry.target.dataset.accent;
    const rgb = entry.target.dataset.accentRgb;
    setSceneColor(accent);
    document.documentElement.style.setProperty('--scene-accent', accent);
    document.documentElement.style.setProperty('--scene-accent-rgb', rgb);
  });
}, { threshold: 0.4 });

document.querySelectorAll('[data-scene]').forEach(s => sceneObserver.observe(s));
```

- [ ] **Step 5: Verify**

Scroll slowly. In console:
```js
setInterval(() => {
  console.log(
    getComputedStyle(document.documentElement).getPropertyValue('--scene-accent').trim()
  );
}, 500);
```
Expected: changes from `#00e5ff` → `#a855f7` → `#ff2d78` → `#f59e0b` → `#00e5ff` as you scroll. Canvas glow shifts in sync.

- [ ] **Step 6: Commit**
```bash
git add index.html
git commit -m "feat: canvas color lerp and scene IntersectionObserver"
```

---

### Task 4: Boot Sequence

**Files:**
- Modify: `index.html` — HTML + CSS + JS

- [ ] **Step 1: Add boot overlay HTML**

Inside `<section id="scene-0">`, as the FIRST child:
```html
<div id="boot-overlay" aria-live="polite" aria-label="Site initializing">
  <div id="boot-text"></div>
</div>
```

- [ ] **Step 2: Add boot overlay CSS**

```css
#boot-overlay {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transition: opacity 0.5s ease;
}
#boot-overlay.done { opacity: 0; }
#boot-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(11px, 2vw, 15px);
  color: var(--scene-accent);
  letter-spacing: 0.2em;
  text-align: center;
  user-select: none;
}
```

- [ ] **Step 3: Add boot sequence JS**

```js
const BOOT_STEPS = [
  { text: 'INITIALIZING NEURAL NETWORK...', ms: 0 },
  { text: 'SYNAPTIC PATHWAYS: ONLINE', ms: 900 },
  { text: 'LOADING CONSCIOUSNESS...', ms: 1600 },
];
const BOOT_TOTAL_MS = 2300;

function runBoot() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelector('.hero-identity')?.style.setProperty('opacity', '1');
    return;
  }

  const overlay = document.getElementById('boot-overlay');
  const bootText = document.getElementById('boot-text');
  const heroId = document.querySelector('.hero-identity');
  if (!overlay) return;

  let done = false;

  function finishBoot() {
    if (done) return;
    done = true;
    document.removeEventListener('click', finishBoot);
    document.removeEventListener('keydown', finishBoot);
    overlay.classList.add('done');
    if (heroId) heroId.style.opacity = '1';
    setTimeout(() => { overlay.style.display = 'none'; }, 550);
  }

  // Skip on any interaction
  document.addEventListener('click', finishBoot, { once: true });
  document.addEventListener('keydown', finishBoot, { once: true });

  BOOT_STEPS.forEach(step => {
    setTimeout(() => { if (!done) bootText.textContent = step.text; }, step.ms);
  });
  setTimeout(finishBoot, BOOT_TOTAL_MS);
}

document.addEventListener('DOMContentLoaded', runBoot);
```

- [ ] **Step 4: Staggered neuron fire on boot**

In the RAF draw loop setup (after canvas initialization), add a boot fire effect. Find where neurons are initialized (e.g., `neurons.forEach(n => { n.opacity = 0; })`). After initialization completes, add:

```js
// Fire neurons outward during boot
let bootFireIndex = 0;
const bootFireInterval = setInterval(() => {
  if (bootFireIndex >= neurons.length) { clearInterval(bootFireInterval); return; }
  neurons[bootFireIndex].opacity = Math.random() * 0.6 + 0.3;
  bootFireIndex++;
}, 20); // ~20ms per neuron = fires all over ~1-2s depending on count
```

- [ ] **Step 5: Verify**

Reload page. Confirm:
1. Boot text sequences over ~2.3s
2. Neurons fire progressively during boot
3. Hero name/tagline hidden during boot, fades in after
4. Clicking at any point during boot immediately shows hero content
5. No layout shift, no console errors

- [ ] **Step 6: Commit**
```bash
git add index.html
git commit -m "feat: boot sequence with neuron fire and skip support"
```

---

### Task 5: Synapse Scroll Indicator

**Files:**
- Modify: `index.html` — HTML + CSS + JS

- [ ] **Step 1: Find and replace the existing scroll hint**

Find the existing scroll hint element (look for `.scroll-hint`, a vertical line, or `scroll-indicator`). Replace its inner markup with:

```html
<div class="synapse-scroll-hint" aria-hidden="true">
  <div class="synapse-dot-indicator"></div>
  <div class="synapse-line-indicator"></div>
</div>
```

Keep the existing wrapper element and its `position:fixed` + `z-index` — just replace the inner content.

- [ ] **Step 2: Add CSS**

```css
.synapse-scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: opacity 0.4s ease;
}
.synapse-dot-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--scene-accent);
  box-shadow: 0 0 10px var(--scene-accent);
  animation: sdot-pulse 1.8s ease-in-out infinite;
}
.synapse-line-indicator {
  width: 1px;
  height: 32px;
  background: linear-gradient(to bottom, var(--scene-accent), transparent);
  animation: sline-pulse 1.8s ease-in-out infinite;
  transform-origin: top;
}
@keyframes sdot-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.55); opacity: 0.35; }
}
@keyframes sline-pulse {
  0%, 100% { transform: scaleY(1); opacity: 0.6; }
  50% { transform: scaleY(0.5); opacity: 0.15; }
}
```

- [ ] **Step 3: Hide on scroll past hero**

Find the existing scroll handler (likely `window.addEventListener('scroll', ...)`) or add a new one:

```js
const scrollHintEl = document.querySelector('.synapse-scroll-hint');
window.addEventListener('scroll', () => {
  if (!scrollHintEl) return;
  scrollHintEl.style.opacity = window.scrollY > window.innerHeight * 0.4 ? '0' : '';
}, { passive: true });
```

- [ ] **Step 4: Verify**

Scroll indicator shows on load, fades as you scroll past the hero. Dot and line animate in sync. Color shifts with scene accent (uses CSS var).

- [ ] **Step 5: Commit**
```bash
git add index.html
git commit -m "feat: synapse scroll indicator replaces old scroll hint"
```

---

### Task 6: Scene 1 — Neural Fact Nodes + Branch CTA

**Files:**
- Modify: `index.html` — HTML + CSS + JS

- [ ] **Step 1: Add `data-node` to stat cards**

Find the 3-column stat grid in the about section. Add `data-node` to each card's wrapper div:
```html
<div class="stat-card" data-node>
```

- [ ] **Step 2: Add node animation CSS**

```css
[data-node] {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.5s ease, transform 0.5s ease,
              box-shadow 0.5s ease, border-color 0.5s ease;
}
[data-node].node-active {
  opacity: 1;
  transform: translateY(0);
  box-shadow: 0 0 20px rgba(var(--scene-accent-rgb), 0.18);
  border-color: rgba(var(--scene-accent-rgb), 0.35);
}
```

- [ ] **Step 3: Add node IntersectionObserver JS**

```js
const nodeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const siblings = Array.from(
      entry.target.parentElement.querySelectorAll('[data-node]')
    );
    const idx = siblings.indexOf(entry.target);
    setTimeout(() => entry.target.classList.add('node-active'), idx * 40);
    nodeObserver.unobserve(entry.target);
  });
}, { threshold: 0.3 });

document.querySelectorAll('[data-node]').forEach(n => nodeObserver.observe(n));
```

- [ ] **Step 4: Add branch CTA HTML**

After the stat grid closing tag, still inside `<section id="scene-1">`, add:

```html
<a href="#scene-3" class="branch-cta" aria-label="Jump to The Work section">
  <span>→</span> JUMP TO THE WORK
</a>
```

- [ ] **Step 5: Add branch CTA CSS**

```css
.branch-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 2.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.15em;
  color: var(--scene-accent);
  text-decoration: none;
  opacity: 0.65;
  transition: opacity 0.25s ease, gap 0.25s ease, var(--scene-transition);
  min-height: 44px; /* touch target */
  align-items: center;
}
.branch-cta:hover { opacity: 1; gap: 14px; }
.branch-cta:focus-visible {
  outline: 2px solid var(--scene-accent);
  outline-offset: 4px;
  border-radius: 3px;
}
```

- [ ] **Step 6: Verify**

Scroll to about section. Confirm:
1. Stat cards start invisible, fade+slide in with 40ms stagger
2. Card borders glow in scene accent color
3. "JUMP TO THE WORK" link smooth-scrolls to `#scene-3`
4. Link has visible focus ring when tabbed to
5. All transitions are smooth (no jank)

- [ ] **Step 7: Commit**
```bash
git add index.html
git commit -m "feat: Scene 1 neural fact nodes and branch CTA"
```

---

### Task 7: Scene 2 — Mission Section Styling + Typewriter

**Files:**
- Modify: `index.html` — CSS + JS

The Mission HTML was added in Task 2. Now add styles and animation.

- [ ] **Step 1: Add Mission section CSS**

```css
.scene-mission {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(3rem, 8vw, 6rem) clamp(1.5rem, 5vw, 4rem);
  position: relative;
}
.mission-content { max-width: 860px; width: 100%; }
.mission-headline {
  font-family: 'Orbitron', monospace;
  font-size: clamp(28px, 5.5vw, 76px);
  font-weight: 700;
  color: #c8d8ff;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0 0 2rem;
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.mission-headline.visible { opacity: 1; transform: translateY(0); }
.mission-body {
  font-family: 'Inter', sans-serif;
  font-size: clamp(15px, 1.8vw, 18px);
  color: #7080aa;
  line-height: 1.75;
  max-width: 620px;
  min-height: 3em; /* reserve space — prevents CLS during typing */
}
.mission-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--scene-accent);
  vertical-align: text-bottom;
  margin-left: 1px;
  animation: blink 1s step-end infinite;
}
```

- [ ] **Step 2: Add typewriter JS**

```js
function typewrite(el, text) {
  // Cap at 2s total per ui-ux-pro-max animation guideline
  const delay = Math.min(28, Math.floor(2000 / text.length));
  const cursor = document.createElement('span');
  cursor.className = 'mission-cursor';
  el.appendChild(cursor);
  let i = 0;
  function tick() {
    if (i >= text.length) { cursor.remove(); return; }
    el.insertBefore(document.createTextNode(text[i++]), cursor);
    setTimeout(tick, delay);
  }
  tick();
}

const missionObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const headline = entry.target.querySelector('.mission-headline');
    const body = entry.target.querySelector('.mission-body');
    headline?.classList.add('visible');
    if (body?.dataset.typewrite) {
      // Start typing after headline reveals (800ms)
      setTimeout(() => {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          typewrite(body, body.dataset.typewrite);
        } else {
          body.textContent = body.dataset.typewrite;
        }
      }, 850);
    }
    missionObs.unobserve(entry.target);
  });
}, { threshold: 0.3 });

const missionScene = document.getElementById('scene-2');
if (missionScene) missionObs.observe(missionScene);
```

- [ ] **Step 3: Verify**

Scroll to Scene 2. Confirm:
1. Canvas shifts to hot pink
2. Scene label appears in hot pink
3. Headline slides up into view
4. Body text types on within ~2s
5. With `prefers-reduced-motion` enabled (DevTools → Rendering → Emulate), all text is immediately visible

- [ ] **Step 4: Commit**
```bash
git add index.html
git commit -m "feat: Scene 2 Mission with typewriter and scroll reveal"
```

---

### Task 8: Scene 3 — Work Card Grid

**Files:**
- Modify: `index.html` — HTML + CSS

Replace the existing thoughts section content with the work card grid.

- [ ] **Step 1: Replace thoughts section inner content**

Inside `<section id="scene-3" class="scene-work">`, remove all existing child elements and replace with:

```html
<div class="work-content">
  <div class="scene-label">03 / THE WORK</div>
  <div class="work-grid">

    <div class="work-card" data-panel="thought-llm"
         role="button" tabindex="0"
         aria-label="Explore: Why Nepal's Fintech Needs Its Own LLMs">
      <div class="card-type">THOUGHT</div>
      <h3 class="card-title">Why Nepal's Fintech Needs Its Own LLMs</h3>
      <div class="card-meta">6 min read</div>
      <div class="card-synapse" aria-hidden="true"></div>
      <div class="card-cta" aria-hidden="true">EXPLORE NODE <span>→</span></div>
    </div>

    <div class="work-card" data-panel="synapse-game"
         role="button" tabindex="0"
         aria-label="Explore: Synapse Neural Network Game">
      <div class="card-type">EXPERIENCE</div>
      <h3 class="card-title">Synapse — Neural Network Game</h3>
      <div class="card-meta">Interactive · Canvas</div>
      <div class="card-synapse" aria-hidden="true"></div>
      <div class="card-cta" aria-hidden="true">EXPLORE NODE <span>→</span></div>
    </div>

    <div class="work-card work-card--locked"
         aria-disabled="true" tabindex="-1"
         aria-label="Next node coming soon">
      <div class="card-type">COMING SOON</div>
      <h3 class="card-title">Next node initializing...</h3>
      <div class="card-meta">??? · ???</div>
      <div class="card-cta locked" aria-hidden="true">LOCKED <span>◈</span></div>
    </div>

  </div>
</div>
```

- [ ] **Step 2: Add work section CSS**

```css
.scene-work {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: clamp(3rem, 8vw, 6rem) clamp(1.5rem, 5vw, 4rem);
}
.work-content { max-width: 1100px; width: 100%; margin: 0 auto; }
.work-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
  margin-top: 2rem;
}
.work-card {
  position: relative;
  background: rgba(var(--scene-accent-rgb), 0.04);
  border: 1px solid rgba(var(--scene-accent-rgb), 0.15);
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  transition:
    background 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.2s ease,
    var(--scene-transition);
  outline: none;
}
.work-card:hover:not(.work-card--locked),
.work-card:focus-visible:not(.work-card--locked) {
  background: rgba(var(--scene-accent-rgb), 0.08);
  border-color: rgba(var(--scene-accent-rgb), 0.4);
  box-shadow: 0 0 24px rgba(var(--scene-accent-rgb), 0.15);
  transform: translateY(-3px);
}
.work-card:focus-visible {
  outline: 2px solid var(--scene-accent);
  outline-offset: 3px;
}
.work-card--locked { opacity: 0.32; cursor: default; pointer-events: none; }
.card-type {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--scene-accent);
  margin-bottom: 10px;
  transition: var(--scene-transition);
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #c8d8ff;
  line-height: 1.4;
  margin: 0 0 10px;
}
.card-meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #7080aa;
  margin-bottom: 18px;
}
.card-synapse {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--scene-accent);
  box-shadow: 0 0 8px var(--scene-accent);
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}
.work-card:hover .card-synapse,
.work-card:focus-visible .card-synapse {
  opacity: 1;
  animation: sdot-pulse 1.5s ease-in-out infinite;
}
.card-cta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--scene-accent);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  opacity: 0.45;
  transition: opacity 0.25s ease, gap 0.25s ease, var(--scene-transition);
}
.work-card:hover .card-cta:not(.locked),
.work-card:focus-visible .card-cta:not(.locked) { opacity: 1; gap: 10px; }
.card-cta.locked { color: #3e4870; pointer-events: none; }
```

- [ ] **Step 3: Verify**

Scroll to Scene 3. Confirm:
1. 3-column card grid renders (or 1-2 columns on mobile)
2. Canvas shifts to amber gold
3. Cards glow amber on hover
4. Synapse dot appears on hover
5. Locked card is non-interactive and dimmed
6. Cards are keyboard-focusable

- [ ] **Step 4: Commit**
```bash
git add index.html
git commit -m "feat: Scene 3 work card grid"
```

---

### Task 9: Side Panel

**Files:**
- Modify: `index.html` — HTML + CSS + JS

- [ ] **Step 1: Add panel HTML before `</body>`**

```html
<div id="node-panel" role="dialog" aria-modal="true"
     aria-label="Node details" aria-hidden="true">
  <button class="panel-close" id="panel-close" aria-label="Close node panel">✕</button>
  <div id="panel-content"></div>
</div>
<div id="panel-backdrop" aria-hidden="true"></div>
```

- [ ] **Step 2: Add panel CSS**

```css
#node-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: min(340px, 90vw);
  height: 100%;
  background: rgba(7, 7, 26, 0.96);
  border-left: 1px solid rgba(var(--scene-accent-rgb), 0.3);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 28px 24px;
  z-index: 80;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.5s ease;
  overflow-y: auto;
  overscroll-behavior: contain;
}
#node-panel.open { transform: translateX(0); }
#node-panel[aria-hidden="true"] { visibility: hidden; }
#node-panel[aria-hidden="false"] { visibility: visible; }

#panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  z-index: 79;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
#panel-backdrop.open { opacity: 1; pointer-events: auto; }

.panel-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #3e4870;
  font-size: 18px;
  cursor: pointer;
  border-radius: 6px;
  transition: color 0.2s ease, background 0.2s ease;
}
.panel-close:hover { color: #c8d8ff; background: rgba(255,255,255,0.05); }
.panel-close:focus-visible { outline: 2px solid var(--scene-accent); outline-offset: 2px; }

/* Mobile: bottom sheet */
@media (max-width: 599px) {
  #node-panel {
    top: auto;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 72dvh;
    border-left: none;
    border-top: 1px solid rgba(var(--scene-accent-rgb), 0.3);
    border-radius: 16px 16px 0 0;
    transform: translateY(100%);
  }
  #node-panel.open { transform: translateY(0); }
}

/* Panel content styles */
.panel-type {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--scene-accent);
  margin-bottom: 6px;
  margin-top: 2rem;
  transition: var(--scene-transition);
}
.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #c8d8ff;
  line-height: 1.35;
  margin: 0 0 16px;
}
.panel-divider {
  border: none;
  border-top: 1px solid rgba(var(--scene-accent-rgb), 0.2);
  margin-bottom: 16px;
  transition: var(--scene-transition);
}
.panel-excerpt {
  font-size: 13px;
  color: #7080aa;
  line-height: 1.7;
  margin-bottom: 20px;
}
.panel-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.panel-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(var(--scene-accent-rgb), 0.1);
  border: 1px solid rgba(var(--scene-accent-rgb), 0.3);
  color: var(--scene-accent);
  transition: var(--scene-transition);
}
.panel-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.1em;
  color: var(--scene-accent);
  border: 1px solid rgba(var(--scene-accent-rgb), 0.4);
  padding: 12px 20px;
  min-height: 44px;
  border-radius: 6px;
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease, var(--scene-transition);
}
.panel-cta-btn:hover {
  background: rgba(var(--scene-accent-rgb), 0.08);
  border-color: rgba(var(--scene-accent-rgb), 0.7);
}
.panel-cta-btn:focus-visible {
  outline: 2px solid var(--scene-accent);
  outline-offset: 3px;
}
```

- [ ] **Step 3: Add panel data + JS**

```js
const PANEL_DATA = {
  'thought-llm': {
    type: 'THOUGHT',
    title: "Why Nepal's Fintech Needs Its Own LLMs",
    excerpt: "Nepal's financial systems run on remittances, mobile-first infrastructure, and a dozen distinct languages. No model trained on Western data understands that.",
    tags: ['LLM', 'Nepal', 'Fintech'],
    cta: { text: 'READ FULL ARTICLE', href: 'thoughts/why-nepal-fintech-needs-own-llms.html' },
    external: false,
  },
  'synapse-game': {
    type: 'EXPERIENCE',
    title: 'Synapse — Neural Network Game',
    excerpt: 'An interactive canvas-based game where you grow and defend a neural network. Built with pure Canvas API — zero libraries, runs entirely in the browser.',
    tags: ['Canvas', 'Vanilla JS', 'Game'],
    cta: { text: 'PLAY SYNAPSE', href: 'game.html' },
    external: true,
  },
};

const panel = document.getElementById('node-panel');
const panelContent = document.getElementById('panel-content');
const panelClose = document.getElementById('panel-close');
const backdrop = document.getElementById('panel-backdrop');
let prevFocus = null;
let removeFocusTrap = null;

function openPanel(key) {
  const data = PANEL_DATA[key];
  if (!data) return;

  panelContent.innerHTML = `
    <div class="panel-type">${data.type}</div>
    <h2 class="panel-title">${data.title}</h2>
    <hr class="panel-divider">
    <p class="panel-excerpt">${data.excerpt}</p>
    <div class="panel-tags">${data.tags.map(t => `<span class="panel-tag">${t}</span>`).join('')}</div>
    <a href="${data.cta.href}" class="panel-cta-btn"${data.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>
      ${data.cta.text} →
    </a>
  `;

  prevFocus = document.activeElement;
  panel.setAttribute('aria-hidden', 'false');
  panel.classList.add('open');
  backdrop.classList.add('open');
  document.querySelectorAll('.work-card').forEach(c => { c.style.opacity = '0.38'; });

  // Focus trap
  const focusable = Array.from(
    panel.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')
  );
  focusable[0]?.focus();

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first?.focus();
    }
  }
  panel.addEventListener('keydown', trapFocus);
  removeFocusTrap = () => panel.removeEventListener('keydown', trapFocus);
}

function closePanel() {
  panel.classList.remove('open');
  backdrop.classList.remove('open');
  setTimeout(() => panel.setAttribute('aria-hidden', 'true'), 200); // after exit anim
  document.querySelectorAll('.work-card').forEach(c => { c.style.opacity = ''; });
  removeFocusTrap?.();
  removeFocusTrap = null;
  prevFocus?.focus();
}

// Open
document.querySelectorAll('.work-card[data-panel]').forEach(card => {
  card.addEventListener('click', () => openPanel(card.dataset.panel));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(card.dataset.panel); }
  });
});

// Close
panelClose.addEventListener('click', closePanel);
backdrop.addEventListener('click', closePanel);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
});
```

- [ ] **Step 4: Verify**

Click "Why Nepal's Fintech" card. Confirm:
1. Panel slides in from right in ~300ms
2. Background cards dim to ~40% opacity
3. Focus moves to close button (✕)
4. Tab key cycles within panel only (trap works — test by tabbing past the CTA link, focus returns to close button)
5. Escape closes panel
6. Backdrop click closes panel
7. Focus returns to the card that opened it
8. Panel content is correct (title, excerpt, tags, CTA)
9. On 375px viewport: panel comes up from bottom as a sheet

- [ ] **Step 5: Commit**
```bash
git add index.html
git commit -m "feat: side panel with focus trap and mobile bottom sheet"
```

---

### Task 10: Scene 4 — Contact Rebuild

**Files:**
- Modify: `index.html` — HTML + CSS + JS

- [ ] **Step 1: Prepend intro to contact section**

Inside `<section id="scene-4" class="scene-signal">`, before the existing contact grid:

```html
<div class="signal-intro">
  <div class="scene-label">04 / THE SIGNAL</div>
  <h2 class="signal-headline">The network is open.</h2>
</div>
```

Add `data-contact-item` to each existing contact link/block:
```html
<div class="contact-item" data-contact-item>
```

- [ ] **Step 2: Add signal section CSS**

```css
.scene-signal {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(3rem, 8vw, 6rem) clamp(1.5rem, 5vw, 4rem);
  text-align: center;
}
.signal-intro { margin-bottom: 3rem; }
.signal-headline {
  font-family: 'Orbitron', monospace;
  font-size: clamp(24px, 4.5vw, 60px);
  font-weight: 700;
  color: #c8d8ff;
  margin: 0;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.signal-headline.visible { opacity: 1; transform: translateY(0); }
[data-contact-item] {
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
[data-contact-item].visible { opacity: 1; transform: translateY(0); }
```

- [ ] **Step 3: Add signal scene JS**

**BEFORE WRITING:** Check the brain canvas code for the actual variable names for:
- The neurons/nodes array
- Any method for making all neurons fire at once

Then write the observer:

```js
function fireSignalBurst() {
  // Replace 'neurons' with the actual array variable name from the canvas code
  if (typeof neurons === 'undefined') return;
  const snapshot = neurons.map(n => ({ opacity: n.opacity, active: n.active }));
  neurons.forEach(n => { n.opacity = 1; });
  setTimeout(() => {
    neurons.forEach((n, i) => { n.opacity = snapshot[i].opacity; });
  }, 1400);
}

const signalObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const headline = entry.target.querySelector('.signal-headline');
    headline?.classList.add('visible');

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fireSignalBurst();
    }

    entry.target.querySelectorAll('[data-contact-item]').forEach((item, i) => {
      setTimeout(() => item.classList.add('visible'), 350 + i * 40);
    });

    signalObs.unobserve(entry.target);
  });
}, { threshold: 0.3 });

const signalScene = document.getElementById('scene-4');
if (signalScene) signalObs.observe(signalScene);
```

- [ ] **Step 4: Verify**

Scroll to contact. Confirm:
1. "04 / THE SIGNAL" label appears in cyan
2. "The network is open." slides up
3. Canvas fires a full neuron burst
4. Contact items animate in with ~40ms stagger
5. With prefers-reduced-motion: items appear immediately, no burst

- [ ] **Step 5: Commit**
```bash
git add index.html
git commit -m "feat: Scene 4 Signal contact rebuild with synapse burst"
```

---

### Task 11: Accessibility + Animation Polish

**Files:**
- Modify: `index.html` — CSS + JS + HTML

- [ ] **Step 1: Add `prefers-reduced-motion` CSS block**

At the very END of the `<style>` block, add:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  /* Immediately show content that animations would reveal */
  .hero-identity { opacity: 1 !important; }
  .mission-headline { opacity: 1 !important; transform: none !important; }
  .signal-headline { opacity: 1 !important; transform: none !important; }
  [data-node] { opacity: 1 !important; transform: none !important; }
  [data-contact-item] { opacity: 1 !important; transform: none !important; }
  #boot-overlay { display: none !important; }
}
```

- [ ] **Step 2: Fix cursor ring — remove width/height animation**

Find the CSS that animates the cursor ring's `width` and `height` on hover (look for `.cursor-ring` hover or a similar selector). Replace any `width`/`height` transition with `transform: scale()`:

```css
/* Find and remove these (whatever the existing values are): */
/* .cursor-ring.hovering { width: 52px; height: 52px; } */

/* Replace with: */
.cursor-ring {
  transform-origin: center center;
  /* keep existing transition but remove width/height, keep: */
  transition: transform 0.25s ease, border-color 0.25s ease, opacity 0.25s ease;
}
.cursor-ring.hovering { transform: scale(1.6); }
```

Find the JS that changes cursor ring size (look for `cursorRing.style.width` or similar). Replace those assignments with:
```js
cursorRing.classList.add('hovering');   // on hover enter
cursorRing.classList.remove('hovering'); // on hover leave
```
(Variable name `cursorRing` — replace with whatever the actual variable name is.)

- [ ] **Step 3: Fix audio button touch target**

Find the audio toggle button element. Add to its CSS rule:

```css
/* Find the audio toggle selector (likely #audio-toggle or .audio-btn) */
#audio-toggle {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 4: Add missing aria-labels**

Find the brain canvas element and add:
```html
<canvas id="brain" role="img" aria-label="Interactive 3D neural network visualization"></canvas>
```

Find the nav element (if it exists) and add:
```html
<nav aria-label="Site navigation">
```

Find the command palette trigger (if it's a button or keyboard listener element):
```html
<!-- If there's a visible trigger button: -->
<button aria-label="Open command palette (Ctrl+K or Cmd+K)">
```

If the command palette is keyboard-only, add to the `<body>` or a help element:
```html
<p class="sr-only">Press Ctrl+K to open the command palette</p>
```

Add this CSS for the screen-reader utility class if not already present:
```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 5: Verify accessibility**

Open DevTools → Accessibility tab. Tab through the entire page. Confirm:
1. No focus gets lost at any point
2. Panel focus trap works (Task 9)
3. All interactive elements have accessible names (check Accessibility pane)
4. Enable "Emulate prefers-reduced-motion: reduce" in Rendering tab — all content immediately visible, no animations
5. Canvas has a role and label visible in accessibility tree

- [ ] **Step 6: Commit**
```bash
git add index.html
git commit -m "feat: accessibility pass — reduced-motion, aria, touch targets, cursor fix"
```

---

### Task 12: Performance Verification + Final Polish

**Files:**
- Modify: `index.html` if issues found

- [ ] **Step 1: Run Lighthouse**

Open Chrome DevTools → Lighthouse. Run a Performance + Accessibility audit on `localhost`. Note scores.

- [ ] **Step 2: Check for layout thrashing**

Open DevTools → Performance tab. Record a 5-second clip while scrolling through all scenes. In the flame chart, check for:
- Purple "Layout" bars during scroll (bad — means we're forcing reflow)
- Layout during panel open/close (should be zero — we use transform only)

If layout bars appear during scroll: check if any `scrollY`-based code reads `offsetHeight`, `getBoundingClientRect`, or similar after DOM mutations. Move all reads before writes.

- [ ] **Step 3: Check canvas RAF efficiency**

In the existing canvas draw loop, verify:
- Only one `requestAnimationFrame` loop is running (not multiple competing loops)
- The loop uses `cancelAnimationFrame` if the canvas is off-screen (optional optimization if frame rate is low)

- [ ] **Step 4: Check for console errors**

Open the site fresh (no cache). Check console for errors. Common issues:
- `neurons is not defined` — Task 10's `fireSignalBurst` references wrong variable name; fix to match actual canvas code
- `Cannot read properties of null` — an element selector returned null; guard with `?.`

- [ ] **Step 5: Test on mobile viewport**

In DevTools, switch to iPhone SE (375×667). Scroll through all 5 scenes. Confirm:
1. No horizontal overflow
2. Font sizes readable (≥16px body)
3. Cards don't overflow grid
4. Side panel opens as bottom sheet, not right panel
5. Boot sequence shows (and can be dismissed by tap)
6. All touch targets feel large enough

- [ ] **Step 6: Final commit**
```bash
git add index.html
git commit -m "feat: performance verified, mobile tested, cinematic redesign complete"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Scene 0: Boot sequence (T4), skip on click/key (T4), neuron fire (T4), synapse scroll indicator (T5)
- ✅ Scene 1: Canvas color shift (T3), word-by-word reveal (existing, untouched), neural fact nodes (T6), branch CTA (T6)
- ✅ Scene 2: Mission HTML (T2), headline + typewriter (T7), canvas color pink (T3)
- ✅ Scene 3: Work cards HTML (T8), hover states (T8), side panel (T9), focus trap (T9), mobile bottom sheet (T9)
- ✅ Scene 4: Signal headline (T10), synapse burst (T10), staggered contact nodes (T10)
- ✅ Canvas color interpolation 500ms ease-in-out (T3)
- ✅ CSS --scene-accent custom property (T1)
- ✅ IntersectionObserver threshold 0.4 (T3)
- ✅ prefers-reduced-motion (T11)
- ✅ Cursor ring → transform:scale (T11)
- ✅ Audio button 44px touch target (T11)
- ✅ Aria-labels for canvas, nav, command palette (T11)
- ✅ Panel close: X button, Escape, backdrop (T9)
- ✅ Focus restore after panel close (T9)
- ✅ Mobile: bottom sheet (T9)
- ✅ Stagger timing 40ms (T6, T10) — corrected from spec's 200ms per ui-ux-pro-max
- ✅ Typewriter max 2s cap (T7)
- ✅ Boot skippable (T4)
- ✅ Performance: no new HTTP requests, transform/opacity only, passive listeners (throughout)

**Placeholder scan:** All steps contain complete code. Variable name caveats (neurons, ctx, cursorRing) are legitimate "read first" notes, not placeholders.

**Type consistency:**
- `PANEL_DATA` keys `'thought-llm'` and `'synapse-game'` ↔ `data-panel` attributes in T8 ✅
- `openPanel(card.dataset.panel)` references same keys ✅
- `setSceneColor(hex)` defined T3 Step 2, called T3 Step 4 ✅
- `.node-active` class: styled T6 Step 2, added T6 Step 3 ✅
- `.visible` class: styled in T7, T10; added by observers in T7, T10 ✅
- `lerpFromRgb`, `lerpToRgb`, `lerpProgress`, `lerpStartMs` defined T3 Step 2, used T3 Step 2 ✅
- `currentNeuronRgb` defined T3 Step 2, mutated by `tickColorLerp` T3 Step 2 ✅
