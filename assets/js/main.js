import { profile, shelf } from '../data/shelf.js';
import { loadShelf } from './books.js';
// graph + panel wiring arrive in Tasks 8–9.

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
      ${b.cover ? `<img src="${b.cover}" alt="" class="cover">` : `<div class="cover mono">${(b.title||'?').slice(0,2).toUpperCase()}</div>`}
      <div><h3>${b.title}</h3><p class="dim">${b.authors || ''}</p>
      ${Number.isFinite(b.progress) ? `<div class="progress"><i style="width:${Math.round(b.progress*100)}%"></i></div>` : ''}
      ${b.note ? `<p class="note">${b.note}</p>` : ''}</div>
    </article>`).join('');
}

const GROUPS = [['reading','Reading'],['read','Read'],['want','Want to read']];
function stars(r) { return r ? '★'.repeat(r) + '☆'.repeat(5 - r) : ''; }
export function renderList(books) {
  return GROUPS.map(([key, label]) => {
    const items = books.filter(b => b.status === key);
    if (!items.length) return '';
    const cards = items.map(b => `
      <article class="book-card" data-key="${b.key ?? ''}" tabindex="0" role="button" aria-label="${b.title}">
        ${b.cover ? `<img src="${b.cover}" alt="" class="cover">` : `<div class="cover mono">${(b.title||'?').slice(0,2).toUpperCase()}</div>`}
        <div class="bc-body"><h4>${b.title}</h4><p class="dim">${b.authors||''}</p>
        <p class="rating" aria-label="${b.rating||0} out of 5">${stars(b.rating)}</p>
        <p class="review">${b.review || b.note || ''}</p></div>
      </article>`).join('');
    return `<div class="group"><h3 class="group-h">${label}</h3><div class="card-grid">${cards}</div></div>`;
  }).join('');
}

async function boot() {
  renderProfile(profile);
  const books = await loadShelf(shelf);
  const cr = document.getElementById('cr');
  if (cr) cr.innerHTML = renderCurrentlyReading(books);
  const lv = document.getElementById('list-view');
  if (lv) lv.innerHTML = renderList(books);
  window.__books = books; // handed to Task 8/9 wiring
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
}
