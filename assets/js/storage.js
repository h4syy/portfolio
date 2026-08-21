// Safe persistence: uses localStorage when available, else an in-memory Map. Never throws.
const mem = new Map();
function backing() {
  try {
    if (typeof localStorage !== 'undefined') { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; }
  } catch { /* fall through */ }
  return { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
}
const store = backing();

export function get(key) { try { return store.getItem(key); } catch { return null; } }
export function set(key, value) { try { store.setItem(key, value); } catch { /* ignore quota */ } }
export function getJSON(key) { const raw = get(key); if (raw == null) return null; try { return JSON.parse(raw); } catch { return null; } }
export function setJSON(key, value) { try { set(key, JSON.stringify(value)); } catch { /* ignore */ } }
