/* ===========================================================
 * docsify sw.js (区分 .md 和其他资源)
 * ===========================================================
 */
const RUNTIME = 'docsify'
const HOSTNAME_WHITELIST = [
  self.location.hostname,
  'fonts.gstatic.com',
  'fonts.googleapis.com',
  'cdn.jsdelivr.net',
  'hw.acmsz.top'
]

// 修正 URL
const getFixedUrl = (req) => {
  var url = new URL(req.url)
  url.protocol = self.location.protocol
  return url.href
}

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  const hostname = url.hostname
  const requestUrl = event.request.url

  // 1) docsify .md 文件：网络优先，离线兜底
  if (requestUrl.endsWith('.md')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(networkResp => {
          // 更新缓存
          const respClone = networkResp.clone()
          caches.open(RUNTIME).then(cache => cache.put(event.request, respClone))
          return networkResp
        })
        .catch(() => caches.match(event.request)) // 离线兜底
    )
    return
  }

  // 2) 白名单资源：缓存优先 + 后台更新
  if (HOSTNAME_WHITELIST.includes(hostname)) {
    const fixedUrl = getFixedUrl(event.request)
    const fetched = fetch(fixedUrl, { cache: 'no-store' })

    event.respondWith(
      caches.match(event.request).then(cachedResp => {
        return cachedResp || fetched
      })
    )

    event.waitUntil(
      fetched.then(resp => {
        if (resp && resp.ok) {
          const clone = resp.clone()
          caches.open(RUNTIME).then(cache => cache.put(event.request, clone))
        }
      }).catch(() => { /* 吃掉错误 */ })
    )
    return
  }

  // 3) umami 统计：永远不缓存
  if (hostname === 'umami.acmsz.top') {
    event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 200 }))
    )
    return
  }

  // 4) 其他 js/css 等：缓存优先 + 后台更新
  if (requestUrl.endsWith('.js') || requestUrl.endsWith('.css')) {
    event.respondWith(
      caches.match(event.request).then(cachedResp => {
        const networkFetch = fetch(event.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone()
            caches.open(RUNTIME).then(cache => cache.put(event.request, clone))
          }
          return resp
        })
        return cachedResp || networkFetch
      })
    )
    return
  }
})
