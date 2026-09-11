import { shelf } from '../data/shelf.js';
import { profile, capabilities, cta, experience } from '../data/profile.js';
import { posts } from '../data/posts.js';
import { loadShelf, monogram } from './books.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Cover = a monogram tile with the real cover image layered on top; if the image fails to
// load (unknown ISBN, offline) it removes itself and the monogram shows through. No JS fetch.
function coverHTML(book, cls = '', large = false) {
  const src = large ? (book.coverLarge || book.cover) : book.cover;
  return `<div class="cover${cls ? ' ' + cls : ''}" aria-hidden="true"><span class="cover-mono mono">${esc(monogram(book.title))}</span>`
    + `${src ? `<img src="${esc(src)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>`;
}

export function renderProfile(p, nodes = {}) {
  const nameEl = nodes.nameEl || document.getElementById('name');
  const roleEl = nodes.roleEl || document.getElementById('role');
  const tagEl = nodes.tagEl || document.getElementById('tagline');
  const aboutEl = nodes.aboutEl || document.getElementById('about-body');
  const linksEl = nodes.linksEl || document.getElementById('links');
  if (nameEl) nameEl.textContent = p.name;
  if (roleEl) {
    roleEl.textContent = p.role;
    if (p.location) roleEl.innerHTML = `${esc(p.role)}<span class="role-org">${esc(p.location)}</span>`;
  }
  if (tagEl) tagEl.innerHTML = esc(p.tagline).replace(/real world\.$/, '<em>real world.</em>');
  if (aboutEl) aboutEl.textContent = p.about || '';
  if (linksEl) linksEl.innerHTML = ['email', 'github', 'linkedin'].filter(k => p.links?.[k])
    .map(k => {
      const href = p.links[k];
      const labels = { email: 'Let’s talk', github: 'GitHub', linkedin: 'LinkedIn' };
      return `<a${k === 'email' ? ' class="link-primary"' : ''} href="${esc(href)}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${labels[k]}${k !== 'email' ? '<span class="link-arrow" aria-hidden="true">↗</span>' : ''}</a>`;
    }).join('');
  const stackEl = nodes.stackEl || document.getElementById('stack');
  if (stackEl && p.stack) stackEl.innerHTML = p.stack.map(s => `<span class="chip">${esc(s)}</span>`).join('');
}

export function renderCapabilities(items, el) {
  el = el || document.getElementById('capabilities');
  if (!el) return;
  el.innerHTML = (items || []).map((c, i) => `<div class="cap"><span class="cap-index" aria-hidden="true">/${String(i + 1).padStart(2, '0')}</span><h3>${esc(c.title)}</h3><p class="dim">${esc(c.blurb)}</p></div>`).join('');
}

export function renderContact(cta, links = {}, nodes = {}) {
  const head = nodes.headEl || document.getElementById('cta-headline');
  const lineEl = nodes.lineEl || document.getElementById('cta-line');
  const sub = nodes.subEl || document.getElementById('cta-sub');
  const actions = nodes.actionsEl || document.getElementById('cta-actions');
  if (head) head.textContent = cta.headline;
  if (lineEl && cta.line) {
    // highlight the words "Learn" and "Earn" without trusting raw HTML
    lineEl.innerHTML = esc(cta.line)
      .replace(/\bLearn\b/g, '<b class="accent">Learn</b>')
      .replace(/\bEarn\b/g, '<b class="accent">Earn</b>');
  }
  if (sub) sub.textContent = cta.sub;
  if (actions) {
    const items = [];
    if (links.email) items.push(['Email me', links.email, true]);
    if (links.linkedin) items.push(['LinkedIn', links.linkedin, false]);
    if (links.github) items.push(['GitHub', links.github, false]);
    actions.innerHTML = items.map(([label, href, primary]) =>
      `<a class="cta-btn${primary ? ' cta-btn--primary' : ''}" href="${esc(href)}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(label)}</a>`).join('');
  }
}

export function renderCurrentlyReading(books) {
  const reading = books.filter(b => b.status === 'reading');
  if (!reading.length) return '<p class="dim">Nothing on the desk right now.</p>';
  return reading.map(b => `
    <article class="cr-card" data-key="${esc(b.key ?? b.isbn ?? '')}" tabindex="0" role="button" aria-label="${esc(b.title)}" aria-haspopup="dialog">
      ${coverHTML(b)}
      <div><h3>${esc(b.title)}</h3><p class="dim">${esc(b.authors || '')}</p>
      ${Number.isFinite(b.progress) ? `<div class="progress" role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(b.progress*100)}"><i style="width:${Math.round(b.progress*100)}%"></i></div>` : ''}
      ${b.note ? `<p class="note">${esc(b.note)}</p>` : ''}</div>
    </article>`).join('');
}

// Currently-reading has its own section above the shelf, so the bookshelf is just the rest.
const GROUPS = [['read','Read'],['want','Want to read']];
function stars(r) { return r ? '★'.repeat(r) + '☆'.repeat(5 - r) : ''; }
export function renderList(books) {
  return GROUPS.map(([key, label]) => {
    const items = books.filter(b => b.status === key);
    if (!items.length) return '';
    const cards = items.map(b => `
      <article class="book-card" data-key="${esc(b.key ?? b.isbn ?? '')}" tabindex="0" role="button" aria-label="${esc(b.title)}" aria-haspopup="dialog">
        ${coverHTML(b)}
        <div class="bc-body"><h4>${esc(b.title)}</h4><p class="dim">${esc(b.authors||'')}</p>
        ${b.rating ? `<p class="rating" aria-label="${b.rating} out of 5">${stars(b.rating)}</p>` : ''}
        <p class="review">${esc(b.review || b.note || '')}</p></div>
      </article>`).join('');
    return `<div class="group"><h3 class="group-h">${label}</h3><div class="card-grid">${cards}</div></div>`;
  }).join('');
}

let panelTrigger = null;

export function openPanel(book, nodes = {}) {
  const panel = nodes.panelEl || document.getElementById('panel');
  if (!panel) return;
  panel.innerHTML = `
    <button class="panel-close" aria-label="Close book details">×</button>
    ${coverHTML(book, 'panel-cover', true)}
    <p class="panel-status">${esc({ reading: 'Currently reading', read: 'Finished reading', want: 'Want to read' }[book.status] || '')}</p>
    <h3 id="panel-title">${esc(book.title)}</h3><p class="dim">${esc(book.authors||'')}</p>
    ${book.rating ? `<p class="rating" aria-label="${book.rating} out of 5">${stars(book.rating)}</p>` : ''}
    <p class="panel-review">${esc(book.review || book.note || '')}</p>
    <div class="chips">${(book.categories||[]).map(c=>`<span class="chip">${esc(c)}</span>`).join('')}</div>
    <a class="panel-link" target="_blank" rel="noopener" href="${book.isbn ? `https://books.google.com/books?vid=ISBN${encodeURIComponent(book.isbn)}` : `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(book.title + ' ' + (book.authors||''))}`}">View on Google Books <span aria-hidden="true">↗</span></a>`;
  panelTrigger = document.activeElement;
  panel.setAttribute('aria-labelledby', 'panel-title');
  panel.hidden = false;
  const backdrop = document.getElementById('panel-backdrop');
  if (backdrop) backdrop.hidden = false;
  document.body.classList.add('panel-open');
  document.querySelectorAll('.skip, .topbar, #main, .footer').forEach(el => { el.inert = true; });
  const close = panel.querySelector('.panel-close');
  if (close) {
    close.addEventListener('click', () => closePanel(nodes));
    close.focus();
  }
}

export function closePanel(nodes = {}) {
  const panel = nodes.panelEl || document.getElementById('panel');
  if (panel) panel.hidden = true;
  const backdrop = document.getElementById('panel-backdrop');
  if (backdrop) backdrop.hidden = true;
  document.body.classList.remove('panel-open');
  document.querySelectorAll('.skip, .topbar, #main, .footer').forEach(el => { el.inert = false; });
  if (panelTrigger?.isConnected) panelTrigger.focus();
  panelTrigger = null;
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
      <div class="xp-head"><h3>${esc(x.role)}<span class="xp-org">${esc(x.org)}</span></h3><span class="xp-period mono">${esc(x.period)}</span></div>
      <p class="xp-summary">${esc(x.summary)}</p>
      <div class="chips">${(x.tags||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>
    </article>`).join('');
}

export function renderFlux(items, el) {
  el = el || document.getElementById('posts');
  if (!el) return;
  if (!(items && items.length)) { el.innerHTML = '<p class="dim">Nothing published yet. Soon.</p>'; return; }
  el.innerHTML = items.map(p => `
    <a class="post" href="${esc(p.href)}">
      <div class="post-meta mono"><span class="post-tags">${(p.tags||[]).map(esc).join(' · ')}</span><span class="dim">${esc(p.date)} · ${esc(p.readingTime)}</span></div>
      <div class="post-body"><h2>${esc(p.title)}</h2>
      <p class="post-excerpt dim">${esc(p.excerpt)}</p>
      <span class="post-more">Read essay <span aria-hidden="true">↗</span></span></div>
    </a>`).join('');
}

let _books = [];
const VIEWS = ['work', 'flux', 'reading'];

// Single-page view switcher. Nav anchors are #work/#flux/#reading; hashchange drives this.
function showView(name) {
  if (!VIEWS.includes(name)) name = 'work';
  closePanel();
  document.title = name === 'work' ? 'Yash Paudel — Applied AI & Engineering' : `${name === 'flux' ? 'FLUX' : 'Reading'} — Yash Paudel`;
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
  if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
}

async function boot() {
  // Work
  renderProfile(profile);
  renderCapabilities(capabilities);
  renderExperience(experience);
  renderContact(cta, profile.links);
  document.querySelector('.skip')?.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('main')?.focus();
    window.scrollTo?.(0, 0);
  });
  const talk = document.getElementById('talk');
  if (talk && profile.links && profile.links.email) talk.setAttribute('href', profile.links.email);
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

  // Every book opens the same accessible detail dialog with mouse or keyboard.
  const fromCard = e => {
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest && e.target.closest('[data-key]');
    if (!card) return;
    if (e.type === 'keydown') e.preventDefault();
    const book = keyMap.get(card.dataset.key);
    if (book) {
      card.focus();
      openPanel(book);
    }
  };
  for (const id of ['cr', 'list-view']) {
    const el = document.getElementById(id);
    el?.addEventListener('click', fromCard);
    el?.addEventListener('keydown', fromCard);
  }

  document.getElementById('panel-backdrop')?.addEventListener('click', () => closePanel());
  document.addEventListener('keydown', e => {
    const panel = document.getElementById('panel');
    if (!panel || panel.hidden) return;
    if (e.key === 'Escape') closePanel();
    if (e.key === 'Tab') {
      const focusable = panel.querySelectorAll('button, a[href]');
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  const routeFromHash = () => {
    const h = (typeof location !== 'undefined' && location.hash) ? location.hash.slice(1) : '';
    if (h === 'main') return;
    showView(VIEWS.includes(h) ? h : 'work');
  };
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('hashchange', routeFromHash);
  routeFromHash();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
}
