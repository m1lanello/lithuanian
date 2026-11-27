// Bump VERSION whenever you upload a new index.html so devices refresh.
const VERSION = 'drako-v24';
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./img/0337e4a262.webp", "./img/0c2540df5c.webp", "./img/0cd88cea4c.webp", "./img/10db8cef51.webp", "./img/1a021a7415.webp", "./img/1d03a21d9a.webp", "./img/21e119123f.jpg", "./img/248c1b9696.webp", "./img/3a34ae83e3.webp", "./img/427ef29484.jpg", "./img/47aae5e9ee.jpg", "./img/4a4362e2a8.webp", "./img/4cf9078727.webp", "./img/502425ba90.webp", "./img/537f0db0e5.webp", "./img/551916fca3.webp", "./img/5853d43548.webp", "./img/5de31df32d.jpg", "./img/66029399d1.webp", "./img/6939d49d25.jpg", "./img/6b7f89793d.webp", "./img/6cf964361b.webp", "./img/6ddd708c21.webp", "./img/6ff47f3627.webp", "./img/75eb825cff.webp", "./img/7918d21f55.webp", "./img/7ba8360010.webp", "./img/810f994beb.webp", "./img/84b98c4e43.webp", "./img/8644a4c303.webp", "./img/89a859daa4.webp", "./img/93b3d3f372.jpg", "./img/a23fec1a82.webp", "./img/aebf9dcaec.webp", "./img/b189c12674.webp", "./img/b5c74fb0b9.webp", "./img/b6286e1f34.webp", "./img/b72c07d4e9.jpg", "./img/bb7e36597b.webp", "./img/bd1becbe35.webp", "./img/c7adf82e83.webp", "./img/cdfa388750.webp", "./img/cf39c11eb5.webp", "./img/d0975e92aa.jpg", "./img/d226086d35.webp", "./img/d5984d1204.webp", "./img/d83aafeca2.webp", "./img/de77d90574.webp", "./img/df304a94c7.webp", "./img/df800966d9.webp", "./img/e8316b3db7.webp", "./img/e96234c505.webp", "./img/fce7bf941f.webp", "./img/fd4634e248.webp"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache AI / speech / translate calls: they need a live connection.
  if (/generativelanguage\.googleapis\.com|translate\.google\.com/.test(url.hostname)) return;

  // Page: network first (fresh when online), cache fallback offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('./index.html', c)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Everything else (fonts, icons, images): cache first, then fill the cache.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); }
      return r;
    }).catch(() => hit))
  );
});
