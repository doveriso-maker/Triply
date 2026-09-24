// Only public, same-origin presentation assets may be retained offline.
// Preview documents and live responses always use the network; in particular,
// cached authorization must never reopen a preview after its server expiry.
const CACHE = 'navigam-public-static-v2';
const PUBLIC_ASSETS = new Set([
  '/', '/index.html', '/site.html', '/ar.html', '/ru.html',
  '/marketing.css', '/marketing.js', '/manifest.webmanifest',
  '/icon-192.png', '/icon-512.png',
  '/assets/navigam/brand.css', '/assets/navigam/logo.png',
  '/assets/navigam/symbol.png', '/assets/navigam/icon.svg'
]);

function mayCache(request) {
  const url = new URL(request.url);
  return request.method === 'GET' &&
    url.origin === self.location.origin &&
    !url.search && PUBLIC_ASSETS.has(url.pathname);
}

function isPreviewRequest(request) {
  const url = new URL(request.url);
  return (url.origin === self.location.origin &&
    /^\/(?:p|preview)(?:\/|$)/.test(url.pathname)) ||
    url.pathname.includes('/functions/v1/triply-preview-app');
}

self.addEventListener('install', event => {
  // Do not delay this security update with a precache network dependency.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name !== CACHE && /^(?:triply-|navigam-public-static-)/.test(name)) {
        await caches.delete(name);
        continue;
      }
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        // Also purge protected previews left by any earlier cache version.
        if (isPreviewRequest(request) || (name === CACHE && !mayCache(request))) {
          await cache.delete(request);
        }
      }
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (!mayCache(request)) {
    // No Cache Storage fallback for APIs, private pages, previews or live data.
    // Bypass the browser HTTP cache as well for preview authorization.
    if (isPreviewRequest(request)) {
      event.respondWith(fetch(request, { cache: 'no-store' }));
    }
    return;
  }

  const response = fetch(request);
  event.waitUntil(response.then(async fresh => {
    if (!fresh.ok || fresh.type !== 'basic' || fresh.redirected ||
        /(?:no-store|private)/i.test(fresh.headers.get('Cache-Control') || '')) return;
    const copy = fresh.clone();
    const cache = await caches.open(CACHE);
    await cache.put(request, copy);
  }).catch(() => {}));
  event.respondWith(response.catch(async error => {
    const cached = await (await caches.open(CACHE)).match(request);
    if (cached) return cached;
    throw error;
  }));
});
