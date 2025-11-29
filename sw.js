const RUNTIME = 'docsify'
const HOSTNAME_WHITELIST = [
  self.location.hostname,
  'fonts.gstatic.cn',
  'fonts.googleapis.cn',
  'cdn.jsdelivr.net',
  'hw.acmsz.top',
  'umami.acmsz.top'
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

async function handleUmamiRequest(event) {
  const url = event.request.url

  if (url.endsWith('/script.js')) {
    const cache = await caches.open(RUNTIME)
    const cached = await cache.match(event.request)

    if (cached) {
      event.waitUntil((async () => {
        try {
          const freshResp = await fetch(event.request, { mode: 'no-cors', cache: 'no-store' })
          await cache.put(event.request, freshResp.clone())
        } catch {}
      })())
      return cached
    }

    try {
      const resp = await fetch(event.request, { mode: 'no-cors', cache: 'no-store' })
      await cache.put(event.request, resp.clone())
      return resp
    } catch {
      return new Response('', { status: 200 })
    }
  }

  return fetch(event.request, { mode: 'no-cors', cache: 'no-store' })
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  const hostname = url.hostname
  const requestUrl = event.request.url

  if (hostname === 'umami.acmsz.top') {
    event.respondWith(handleUmamiRequest(event))
    return
  }

  event.respondWith((async () => {
    try {
      if (requestUrl.endsWith('.md')) {
        const cachedResp = await caches.match(event.request)
        if (cachedResp) {
          event.waitUntil((async () => {
            try {
              const networkResp = await fetch(event.request, { cache: 'no-store' })
              if (networkResp.ok) {
                const clone = networkResp.clone()
                const cache = await caches.open(RUNTIME)
                await cache.put(event.request, clone)

                const cachedText = await cachedResp.text()
                const networkText = await networkResp.text()
                if (cachedText !== networkText) {
                  const clients = await self.clients.matchAll()
                  for (const client of clients) {
                    client.postMessage({
                      type: 'CONTENT_UPDATED',
                      url: event.request.url
                    })
                  }
                }
              }
            } catch {}
          })())
          return cachedResp
        } else {
          const networkResp = await fetch(event.request, { cache: 'no-store' })
          if (networkResp.ok) {
            const clone = networkResp.clone()
            const cache = await caches.open(RUNTIME)
            await cache.put(event.request, clone)
          }
          return networkResp
        }
      }

      if (HOSTNAME_WHITELIST.includes(hostname)) {
        const cachedResp = await caches.match(event.request)
        event.waitUntil(updateCache(event.request, getFixedUrl(event.request)))
        return cachedResp || fetch(getFixedUrl(event.request), { cache: 'no-store' })
      }

      if (requestUrl.endsWith('.js') ||
          requestUrl.endsWith('.css') ||
          requestUrl.endsWith('.webp')) {
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
