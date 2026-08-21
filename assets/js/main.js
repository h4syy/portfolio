import { shelf } from '../data/shelf.js';
import { profile, experience, projects } from '../data/profile.js';
import { posts } from '../data/posts.js';
import { loadShelf, monogram } from './books.js';
import { ForceGraph } from './graph.js';
import { lexicalGraph, similarityGraph } from './embed.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Cover = a monogram tile with the real cover image layered on top; if the image fails to
// load (unknown ISBN, offline) it removes itself and the monogram shows through. No JS fetch.
function coverHTML(book, cls = '', large = false) {
  const src = large ? (book.coverLarge || book.cover) : book.cover;
  return `<div class="cover${cls ? ' ' + cls : ''}"><span class="cover-mono mono">${esc(monogram(book.title))}</span>`
    + `${src ? `<img src="${esc(src)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>`;
}

export function renderProfile(p, nodes = {}) {
  const nameEl = nodes.nameEl || document.getElementById('name');
  const roleEl = nodes.roleEl || document.getElementById('role');
  const tagEl = nodes.tagEl || document.getElementById('tagline');
  const aboutEl = nodes.aboutEl || document.getElementById('about-body');
  const linksEl = nodes.linksEl || document.getElementById('links');
  if (nameEl) nameEl.textContent = p.name;
  if (roleEl) roleEl.textContent = p.location ? `${p.role} · ${p.location}` : p.role;
  if (tagEl) tagEl.textContent = p.tagline;
  if (aboutEl) aboutEl.textContent = p.about || '';
  if (linksEl) linksEl.innerHTML = Object.entries(p.links || {})
    .map(([k, href]) => `<a href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${k}</a>`).join('');
}

export function renderCurrentlyReading(books) {
  const reading = books.filter(b => b.status === 'reading');
  if (!reading.length) return '<p class="dim">Nothing on the desk right now.</p>';
  return reading.map(b => `
    <article class="cr-card">
      ${coverHTML(b)}
      <div><h3>${esc(b.title)}</h3><p class="dim">${esc(b.authors || '')}</p>
      ${Number.isFinite(b.progress) ? `<div class="progress"><i style="width:${Math.round(b.progress*100)}%"></i></div>` : ''}
      ${b.note ? `<p class="note">${esc(b.note)}</p>` : ''}</div>
    </article>`).join('');
}

const GROUPS = [['reading','Reading'],['read','Read'],['want','Want to read']];
function stars(r) { return r ? '★'.repeat(r) + '☆'.repeat(5 - r) : ''; }
export function renderList(books) {
  return GROUPS.map(([key, label]) => {
    const items = books.filter(b => b.status === key);
    if (!items.length) return '';
    const cards = items.map(b => `
      <article class="book-card" data-key="${esc(b.key ?? '')}" tabindex="0" role="button" aria-label="${esc(b.title)}">
        ${coverHTML(b)}
        <div class="bc-body"><h4>${esc(b.title)}</h4><p class="dim">${esc(b.authors||'')}</p>
        <p class="rating" aria-label="${b.rating||0} out of 5">${stars(b.rating)}</p>
        <p class="review">${esc(b.review || b.note || '')}</p></div>
      </article>`).join('');
    return `<div class="group"><h3 class="group-h">${label}</h3><div class="card-grid">${cards}</div></div>`;
  }).join('');
}

let _panelBooks = new Map();

export function openPanel(book, nodes = {}) {
  const panel = nodes.panelEl || document.getElementById('panel');
  if (!panel) return;
  panel.innerHTML = `
    <button class="panel-close" aria-label="Close">✕</button>
    ${coverHTML(book, 'panel-cover', true)}
    <h3>${esc(book.title)}</h3><p class="dim">${esc(book.authors||'')}</p>
    <p class="rating">${'★'.repeat(book.rating||0)}</p>
    <p class="panel-review">${esc(book.review || book.note || '')}</p>
    <div class="chips">${(book.categories||[]).map(c=>`<span class="chip">${esc(c)}</span>`).join('')}</div>
    <a class="panel-link" target="_blank" rel="noopener" href="${book.isbn ? `https://books.google.com/books?vid=ISBN${book.isbn}` : `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(book.title + ' ' + (book.authors||''))}`}">View on Google Books →</a>`;
  panel.hidden = false;
  const close = panel.querySelector('.panel-close');
  if (close) close.addEventListener('click', () => closePanel(nodes));
}

export function closePanel(nodes = {}) {
  const panel = nodes.panelEl || document.getElementById('panel');
  if (panel) panel.hidden = true;
}

export function renderStats(books) {
  const el = document.getElementById('stats');
  if (!el) return;
  const total = books.length;
  const finished = books.filter(b => b.status === 'read').length;
  const inProgress = books.filter(b => b.status === 'reading').length;
  el.innerHTML = [
    ['Tracked', total],
    ['Finished', finished],
    ['In progress', inProgress],
  ].map(([label, value]) => `<div><span class="stat-value">${value}</span><span class="stat-label">${label}</span></div>`).join('');
}

export function renderExperience(items, el) {
  el = el || document.getElementById('experience');
  if (!el) return;
  el.innerHTML = (items || []).map(x => `
    <article class="xp">
      <div class="xp-head"><h3>${esc(x.role)} <span class="dim">· ${esc(x.org)}</span></h3><span class="xp-period mono">${esc(x.period)}</span></div>
      <p class="xp-summary">${esc(x.summary)}</p>
      <div class="chips">${(x.tags||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>
    </article>`).join('');
}

export function renderProjects(items, el) {
  el = el || document.getElementById('projects');
  if (!el) return;
  el.innerHTML = (items || []).map(p => {
    const inner = `<div class="proj-head"><h3>${esc(p.name)}</h3><span class="mono dim">${esc(p.year||'')}</span></div>`
      + `<p class="proj-blurb">${esc(p.blurb)}</p>`
      + `<div class="chips">${(p.tags||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>`;
    return p.href
      ? `<a class="proj" href="${esc(p.href)}"${p.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`
      : `<div class="proj">${inner}</div>`;
  }).join('');
}

export function renderFlux(items, el) {
  el = el || document.getElementById('posts');
  if (!el) return;
  if (!(items && items.length)) { el.innerHTML = '<p class="dim">Nothing published yet — soon.</p>'; return; }
  el.innerHTML = items.map(p => `
    <a class="post" href="${esc(p.href)}">
      <div class="post-meta mono"><span class="post-tags">${(p.tags||[]).map(esc).join(' · ')}</span><span class="dim">${esc(p.date)} · ${esc(p.readingTime)}</span></div>
      <h3>${esc(p.title)}</h3>
      <p class="post-excerpt dim">${esc(p.excerpt)}</p>
      <span class="post-more">Read →</span>
    </a>`).join('');
}

export async function initGraph(books, { canvas, onSelect, embedImpl } = {}) {
  canvas = canvas || document.getElementById('graph-canvas');
  _panelBooks = new Map(books.map(b => [b.key ?? b.isbn, b]));
  const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pick = id => { const b = _panelBooks.get(id); if (b) (onSelect || openPanel)(b); };
  const graph = new ForceGraph(canvas, lexicalGraph(books), { onSelect: pick, reducedMotion: reduce });
  graph.start && graph.start();
  const upgrade = async () => {
    try {
      const g = await similarityGraph(books, embedImpl ? { embedImpl } : {});
      graph.setData(g);
      setMode(g.mode);
    } catch {
      // upgrade failed, stay on lexical
    }
  };
  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); upgrade(); } });
    io.observe(canvas);
  } else {
    upgrade();
  }
  return graph;
}

function setMode(mode) {
  const el = document.getElementById('graph-mode');
  if (el) el.textContent = mode === 'lexical' ? 'lexical mode (semantic model unavailable)' : '';
}

let _books = [];
let _graph = null;
let _graphInited = false;
let _currentView = null;
const VIEWS = ['work', 'flux', 'reading'];

// Single-page view switcher. Nav anchors are #work/#flux/#reading; hashchange drives this.
function showView(name) {
  if (!VIEWS.includes(name)) name = 'work';
  // Pause the graph's animation loop when leaving Reading (no need to run while hidden).
  if (_currentView === 'reading' && name !== 'reading' && _graph && _graph.stop) _graph.stop();
  for (const v of VIEWS) {
    const sec = document.getElementById('view-' + v);
    if (sec) sec.hidden = v !== name;
  }
  const navs = document.querySelectorAll('[data-view]');
  if (navs) navs.forEach(a => {
    const on = a.getAttribute('data-view') === name;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  // Graph inits lazily the first time Reading is shown, so the canvas has real dimensions
  // (a hidden 0×0 canvas can't lay out or trigger the intersection-based semantic upgrade).
  if (name === 'reading') {
    if (!_graphInited) {
      _graphInited = true;
      const go = async () => { _graph = await initGraph(_books); };
      if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(go); else go();
    } else if (_graph && _graph.start) {
      _graph.start();
    }
  }
  _currentView = name;
  if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
}

async function boot() {
  // Work
  renderProfile(profile);
  renderExperience(experience);
  renderProjects(projects);
  // FLUX
  renderFlux(posts);

  // Reading
  _books = await loadShelf(shelf);
  const cr = document.getElementById('cr');
  if (cr) cr.innerHTML = renderCurrentlyReading(_books);
  const lv = document.getElementById('list-view');
  if (lv) lv.innerHTML = renderList(_books);
  renderStats(_books);
  window.__books = _books;

  const keyMap = new Map(_books.map(b => [b.key ?? b.isbn, b]));

  const tabGraph = document.getElementById('tab-graph');
  const tabList = document.getElementById('tab-list');
  const graphView = document.getElementById('graph-view');
  const listView = document.getElementById('list-view');
  function showTab(which) {
    if (tabGraph) { tabGraph.setAttribute('aria-pressed', which === 'graph' ? 'true' : 'false'); tabGraph.classList.toggle('is-active', which === 'graph'); }
    if (tabList) { tabList.setAttribute('aria-pressed', which === 'list' ? 'true' : 'false'); tabList.classList.toggle('is-active', which === 'list'); }
    if (graphView) graphView.hidden = which !== 'graph';
    if (listView) listView.hidden = which !== 'list';
  }
  if (tabGraph) tabGraph.addEventListener('click', () => showTab('graph'));
  if (tabList) tabList.addEventListener('click', () => showTab('list'));

  if (listView) {
    const fromCard = e => {
      if (e.type === 'keydown' && e.key !== 'Enter') return;
      const card = e.target.closest && e.target.closest('[data-key]');
      if (!card) return;
      const book = keyMap.get(card.dataset.key);
      if (book) openPanel(book);
    };
    listView.addEventListener('click', fromCard);
    listView.addEventListener('keydown', fromCard);
  }

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

  const routeFromHash = () => {
    const h = (typeof location !== 'undefined' && location.hash) ? location.hash.slice(1) : '';
    showView(VIEWS.includes(h) ? h : 'work');
  };
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('hashchange', routeFromHash);
  routeFromHash();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
}
