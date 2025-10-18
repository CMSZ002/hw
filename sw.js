const RUNTIME = 'docsify'
const HOSTNAME_WHITELIST = [
  self.location.hostname,
  'fonts.gstatic.com',
  'fonts.googleapis.com',
  'cdn.jsdelivr.net',
  'hw.acmsz.top'
]

const getFixedUrl = (req) => {
  const url = new URL(req.url)
  url.protocol = self.location.protocol
  return url.href
}

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

const updateCache = async (request, url) => {
  try {
    const resp = await fetch(url || request, { cache: 'no-store' })
    if (resp.ok) {
      const clone = resp.clone()
      const cache = await caches.open(RUNTIME)
      await cache.put(request, clone)
    }
  } catch {}
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  const hostname = url.hostname
  const requestUrl = event.request.url

  event.respondWith((async () => {
    try {
      if (requestUrl.endsWith('.md')) {
        try {
          const networkResp = await fetch(event.request, { cache: 'no-store' })
          if (networkResp.ok) {
            const clone = networkResp.clone()
            const cache = await caches.open(RUNTIME)
            cache.put(event.request, clone)
          }
          return networkResp
        } catch {
          const cachedResp = await caches.match(event.request)
          return cachedResp || new Response('', { status: 503 })
        }
      }

      if (HOSTNAME_WHITELIST.includes(hostname)) {
        const cachedResp = await caches.match(event.request)
        event.waitUntil(updateCache(event.request, getFixedUrl(event.request)))
        return cachedResp || fetch(getFixedUrl(event.request), { cache: 'no-store' })
      }

      if (hostname === 'umami.acmsz.top') {
        try {
          return await fetch(event.request)
        } catch {
          return new Response('', { status: 200 })
        }
      }

      if (requestUrl.endsWith('.js') || requestUrl.endsWith('.css')) {
        const cachedResp = await caches.match(event.request)
        event.waitUntil(updateCache(event.request))
        return cachedResp || fetch(event.request)
      }

      return await fetch(event.request)
    } catch {
      return new Response('', { status: 503 })
    }
  })())
})
