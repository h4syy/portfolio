import { profile, shelf } from '../data/shelf.js';
import { loadShelf } from './books.js';
import { ForceGraph } from './graph.js';
import { lexicalGraph, similarityGraph } from './embed.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderProfile(p, nodes = {}) {
  const nameEl = nodes.nameEl || document.getElementById('name');
  const roleEl = nodes.roleEl || document.getElementById('role');
  const tagEl = nodes.tagEl || document.getElementById('tagline');
  const aboutEl = nodes.aboutEl || document.getElementById('about-body');
  const linksEl = nodes.linksEl || document.getElementById('links');
  if (nameEl) nameEl.textContent = p.name;
  if (roleEl) roleEl.textContent = p.role;
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
      ${b.cover ? `<img src="${b.cover}" alt="" class="cover">` : `<div class="cover mono">${esc((b.title||'?').slice(0,2).toUpperCase())}</div>`}
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
        ${b.cover ? `<img src="${b.cover}" alt="" class="cover">` : `<div class="cover mono">${esc((b.title||'?').slice(0,2).toUpperCase())}</div>`}
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
    ${book.cover ? `<img src="${book.cover}" alt="" class="panel-cover">` : ''}
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

async function boot() {
  renderProfile(profile);
  const books = await loadShelf(shelf);
  const cr = document.getElementById('cr');
  if (cr) cr.innerHTML = renderCurrentlyReading(books);
  const lv = document.getElementById('list-view');
  if (lv) lv.innerHTML = renderList(books);
  renderStats(books);
  window.__books = books;

  // Build key map for list-view click delegation
  const keyMap = new Map(books.map(b => [b.key ?? b.isbn, b]));

  // Graph | List tab toggle
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

  // Delegate click/Enter on list-view [data-key] cards → openPanel
  if (listView) {
    listView.addEventListener('click', e => {
      const card = e.target.closest('[data-key]');
      if (!card) return;
      const book = keyMap.get(card.dataset.key);
      if (book) openPanel(book);
    });
    listView.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const card = e.target.closest('[data-key]');
      if (!card) return;
      const book = keyMap.get(card.dataset.key);
      if (book) openPanel(book);
    });
  }

  // Esc closes panel
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

  // Initialize graph
  await initGraph(books);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
}
