# yashpaudel.com.np

Personal site of **Yash Paudel** — engineer, builder, working from Nepal. Static HTML,
no build step, no framework. Every page is a single self-contained file you can open
directly in a browser. Deploys on Vercel.

## Pages

| Page | What it is |
| --- | --- |
| `index.html` | The portfolio — an editorial, scroll-snapped "chapters" layout with an ink-wipe reveal, a `⌘K` command palette, and ambient audio. |
| `arcade.html` | **YP // Arcade** — a neon synthwave hub that houses the games and shows your local best scores. |
| `game.html` | **Coastal Drive** — a pseudo-3D endless arcade racer down a sunny coast (day→sunset cycle, traffic, combos, unlockable liveries). |
| `starfall.html` | **Starfall** — a neon bullet-heaven survivor on a reactive gravity grid: auto-firing guns, hordes, bosses, and level-up upgrades. |
| `blog/…` | Long-form writing (essay on fine-tuning LLMs for Nepali fintech). |
| `404.html` | A glitchy "signal lost" page. |

## The Arcade

Two hand-built canvas games, no engines involved.

**Coastal Drive** — steer with `←/→` or `A/D`, `↑` gas, `↓` brake. On mobile, tilt to
steer. Thread traffic for near-miss combos, grab sun-tokens, hit checkpoints, and drive
far enough to unlock new rides. Records save to `localStorage`.

**Starfall** — `WASD`/arrows to move (drag on mobile); your guns aim and fire themselves.
Survive the swarm, collect XP shards, and every level pick one of three upgrades — new
weapons (Pulse, Orbitals, Nova, Arc Lightning, Whip Blades) or passive augments. Bosses
arrive on a timer and flood the field with XP. Reactive warping grid, adaptive quality,
and full procedural WebAudio.

## Run it

It's static. Open any file in a browser, or serve the folder:

```bash
python -m http.server 8000   # then visit http://localhost:8000
```

## Notes

- No dependencies. Fonts load from Google Fonts; everything else is inline.
- Games persist high scores in `localStorage` (`coastal:*`, `starfall:*`).
- Respects `prefers-reduced-motion` where it matters; games auto-pause on tab blur and
  scale their draw distance / effects to hold a smooth framerate on any device.
