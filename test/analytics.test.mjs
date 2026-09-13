import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../assets/js/analytics.js', import.meta.url), 'utf8');

function start(url) {
  const location = new URL(url);
  const listeners = new Map();
  const scripts = [];
  const window = { addEventListener: (name, handler) => listeners.set(name, handler) };
  const document = {
    createElement: () => ({ dataset: {} }),
    head: { appendChild: script => scripts.push(script) },
  };
  runInNewContext(source, { window, document, location });
  return {
    scripts,
    paths: () => Array.from(window.vaq || [], args => args[1].path),
    navigate(hash) { location.hash = hash; listeners.get('hashchange')?.(); },
  };
}

test('one initial view; section switches tracked without skip-link or duplicate views', () => {
  const tracker = start('https://www.yashpaudel.com.np/index.html#reading');
  assert.equal(tracker.scripts.length, 1);
  assert.equal(tracker.scripts[0].src, '/_vercel/insights/script.js');
  assert.equal(tracker.scripts[0].dataset.disableAutoTrack, '1');
  tracker.navigate('#main');
  tracker.navigate('#reading');
  tracker.navigate('#flux');
  tracker.navigate('#work');
  tracker.navigate('');
  tracker.navigate('#reading');
  assert.deepEqual(tracker.paths(), ['/reading', '/flux', '/', '/reading']);
});

test('localhost, file previews and Vercel preview domains do not load or queue analytics', () => {
  for (const url of ['http://localhost:8000/', 'http://127.0.0.1:8000/', 'file:///tmp/index.html', 'https://portfolio-preview.vercel.app/']) {
    const tracker = start(url);
    assert.equal(tracker.scripts.length, 0);
    tracker.navigate('#reading');
    assert.deepEqual(tracker.paths(), []);
  }
});

test('article pageviews use the article path; anchors are not new views', () => {
  const tracker = start('https://yashpaudel.com.np/flux/the-cost-of-keeping-ai-data-in-nepal.html');
  tracker.navigate('#article');
  assert.deepEqual(tracker.paths(), ['/flux/the-cost-of-keeping-ai-data-in-nepal.html']);
});

test('unknown hash routes match the shell fallback to Work', () => {
  const tracker = start('https://www.yashpaudel.com.np/#__proto__');
  tracker.navigate('#reading');
  tracker.navigate('#unknown');
  assert.deepEqual(tracker.paths(), ['/', '/reading', '/']);
});
