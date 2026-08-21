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

// ── Browser renderer ────────────────────────────────────────────────────────
export class ForceGraph {
  #canvas; #ctx; #nodes = []; #edges = [];
  #onSelect; #reducedMotion;
  #hovered = null; #selected = null;
  #rafId = null; #dpr = 1; #W = 800; #H = 600;
  #phase = 0; // pulse phase for reading nodes
  #energy = Infinity;
  #EPSILON = 0.05;

  constructor(canvas, { nodes, edges }, { onSelect = () => {}, reducedMotion = false } = {}) {
    this.#canvas = canvas;
    this.#ctx = canvas.getContext('2d');
    this.#onSelect = onSelect;
    this.#reducedMotion = reducedMotion;
    this.resize();
    this.#initData(nodes, edges);
    this.#bindPointer();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  setData({ nodes, edges }) {
    this.#initData(nodes, edges);
  }

  start() {
    if (this.#reducedMotion) {
      // Static mode: settled frame already drawn by constructor; no animation loop.
      this.#draw();
      return;
    }
    if (this.#rafId !== null) return;
    this.#energy = Infinity;
    const loop = (t) => {
      if (this.#energy > this.#EPSILON) {
        this.#energy = simulateStep(this.#nodes, this.#edges, { W: this.#W, H: this.#H });
      }
      this.#phase = t * 0.003;
      this.#draw();
      this.#rafId = requestAnimationFrame(loop);
    };
    this.#rafId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }

  resize() {
    const dpr = (typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1) || 1;
    this.#dpr = dpr;
    const rect = this.#canvas.getBoundingClientRect();
    this.#W = rect.width;
    this.#H = rect.height;
    this.#canvas.width = this.#W * dpr;
    this.#canvas.height = this.#H * dpr;
    this.#ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.#draw();
  }

  destroy() {
    this.stop();
    this.#canvas.removeEventListener('pointermove', this.#onMove);
    this.#canvas.removeEventListener('pointerdown', this.#onClick);
    this.#canvas.removeEventListener('pointerleave', this.#onLeave);
  }

  selectById(id) {
    this.#selected = this.#nodes.find(n => n.id === id) || null;
    this.#onSelect(id);
    this.#draw();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  #initData(nodes, edges) {
    this.#nodes = nodes.map(n => ({ ...n }));
    this.#edges = edges.map(e => ({ ...e }));
    this.#selected = null;
    this.#hovered = null;
    initLayout(this.#nodes, this.#W, this.#H);
    if (this.#reducedMotion) {
      settle(this.#nodes, this.#edges, { W: this.#W, H: this.#H });
    }
    this.#energy = Infinity;
    this.#draw();
  }

  #clientToCanvas(cx, cy) {
    const rect = this.#canvas.getBoundingClientRect();
    return {
      x: (cx - rect.left),
      y: (cy - rect.top),
    };
  }

  #draw() {
    const ctx = this.#ctx;
    const W = this.#W, H = this.#H;
    ctx.clearRect(0, 0, W, H);

    // edges
    for (const e of this.#edges) {
      const a = this.#nodes.find(n => n.id === e.a);
      const b = this.#nodes.find(n => n.id === e.b);
      if (!a || !b) continue;
      const alpha = 0.15 + (e.w || 0) * 0.55;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(160,170,190,${alpha})`;
      ctx.lineWidth = 1 + (e.w || 0);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // nodes
    for (const n of this.#nodes) {
      const r = n.r || 10;
      const isReading = n.status === 'reading';
      const isSelected = this.#selected && this.#selected.id === n.id;
      const isHovered = this.#hovered && this.#hovered.id === n.id;

      if (isReading && !this.#reducedMotion) {
        // soft glow pulse
        const pulse = r + 4 + Math.sin(this.#phase) * 3;
        const grd = ctx.createRadialGradient(n.x, n.y, r * 0.5, n.x, n.y, pulse * 1.8);
        grd.addColorStop(0, clusterColor(n.cluster) + 'aa');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(n.x, n.y, pulse * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = clusterColor(n.cluster);
      ctx.fill();

      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 2, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();
      }

      // label hovered or selected node
      if (isHovered || isSelected) {
        const label = n.label || n.id;
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(label, n.x, n.y - r - 5);
      }
    }
  }

  // Pointer handler refs (so they can be removed)
  #onMove = (e) => {
    const { x, y } = this.#clientToCanvas(e.clientX, e.clientY);
    this.#hovered = pickNode(this.#nodes, x, y);
    if (this.#reducedMotion) this.#draw();
  };

  #onClick = (e) => {
    const { x, y } = this.#clientToCanvas(e.clientX, e.clientY);
    const hit = pickNode(this.#nodes, x, y);
    if (hit) {
      this.#selected = hit;
      this.#onSelect(hit.id);
      if (this.#reducedMotion) this.#draw();
    }
  };

  #onLeave = () => {
    this.#hovered = null;
    if (this.#reducedMotion) this.#draw();
  };

  #bindPointer() {
    this.#canvas.addEventListener('pointermove', this.#onMove);
    this.#canvas.addEventListener('pointerdown', this.#onClick);
    this.#canvas.addEventListener('pointerleave', this.#onLeave);
  }
}
