// Plain-HTML Vercel Web Analytics. Local and preview visits are not recorded.
(() => {
  if (!['yashpaudel.com.np', 'www.yashpaudel.com.np'].includes(location.hostname)) return;

  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };

  const isShell = location.pathname === '/' || location.pathname === '/index.html';
  const views = { work: '/', flux: '/flux', reading: '/reading' };
  let lastPath;

  function pageview() {
    let path = location.pathname;
    if (isShell) {
      const view = location.hash.slice(1) || 'work';
      // The skip link preserves the view; other unknown hashes fall back to Work.
      if (view === 'main' && lastPath !== undefined) return;
      path = Object.hasOwn(views, view) ? views[view] : '/';
    }
    if (path === lastPath) return;
    lastPath = path;
    window.va('pageview', { path, route: path });
  }

  pageview();
  if (isShell) window.addEventListener('hashchange', pageview);

  const script = document.createElement('script');
  script.src = '/_vercel/insights/script.js';
  script.defer = true;
  // We emit one initial pageview and handle hash navigation ourselves.
  script.dataset.disableAutoTrack = '1';
  document.head.appendChild(script);
})();
