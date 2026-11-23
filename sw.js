// Offline support. Paths are relative to this file so it works both on
// localhost and under /Spotify-Clone-Web-Development/ on GitHub Pages.
//
// Bump VERSION whenever you change any of the cached files.

const VERSION = 'v3';
const SHELL = `shell-${VERSION}`;
const MEDIA = 'media-v1';

const SHELL_FILES = [
  './',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/tracks.js',
  'js/similarity.js',
  'js/queue.js',
  'js/store.js',
  'js/visualizer.js',
  'js/utils.js',
  'data/features.json',
  'manifest.json',
  'assets/icons/logo.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== MEDIA).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // audio: don't touch it. <audio> uses Range requests and caching partial
  // (206) responses properly is more trouble than it's worth here
  if (url.pathname.endsWith('.mp3')) return;

  // images: cache on first view
  if (/\.(png|jpe?g|svg|webp)$/.test(url.pathname)) {
    e.respondWith(
      caches.open(MEDIA).then(async cache => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // app shell: network first so updates show up, cache as fallback offline
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) caches.open(SHELL).then(c => c.put(req, res.clone()));
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html'))),
  );
});
