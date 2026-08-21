const PALETTE = ['#4589ff','#08bdba','#ff832b','#a56eff','#ee5396','#42be65','#d2a106'];
export function clusterColor(c) { return PALETTE[((c || 0) % PALETTE.length + PALETTE.length) % PALETTE.length]; }

function mulberry32(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function initLayout(nodes, W, H, seed = 1) {
  const rnd = mulberry32(seed);
  for (const n of nodes) { n.x = W/2 + (rnd()-0.5)*W*0.5; n.y = H/2 + (rnd()-0.5)*H*0.5; n.vx = 0; n.vy = 0; }
}

export function simulateStep(nodes, edges, opts = {}) {
  const { W = 800, H = 600, repel = 1400, spring = 0.02, springLen = 60, gravity = 0.015, damping = 0.86 } = opts;
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
