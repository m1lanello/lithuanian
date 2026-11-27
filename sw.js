/* Kalbėk service worker — offline app shell.
   Bump VERSION whenever you deploy changed files to force clients to refresh the shell cache. */
const VERSION = 'v49';
const SHELL = 'kalbek-shell-' + VERSION;
const CDN = 'kalbek-cdn-v1';
const SHELL_FILES = ['./', './index.html', './manifest.webmanifest', './icon-v4.svg', './icon-v4-180.png', './icon-v4-192.png', './icon-v4-512.png', './icon-v4-maskable-512.png'];
const CDN_HOSTS = ['cdn.jsdelivr.net'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // add files one by one so a single missing file (e.g. you renamed the page) doesn't abort the install
    await Promise.all(SHELL_FILES.map(f => cache.add(new Request(f, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keep = new Set([SHELL, CDN]);
    for (const k of await caches.keys()) if (k.startsWith('kalbek-') && !keep.has(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;          // never touch audio range requests
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/') || url.pathname.endsWith('.webmanifest')) e.respondWith(networkFirst(req));
    else e.respondWith(cacheFirst(req));
  } else if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(staleWhileRevalidate(req));                              // transformers.js library
  }
  // huggingface.co model files are cached by transformers.js itself (Cache API) — don't double-store them
});

async function networkFirst(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(req)) || (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
  }
}
async function cacheFirst(req) {
  const cache = await caches.open(SHELL), hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}
async function staleWhileRevalidate(req) {
  const cache = await caches.open(CDN), hit = await cache.match(req);
  const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await net) || Response.error();
}
