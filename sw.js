/* ===========================================================
 * docsify sw.js (修正版)
 * ===========================================================
 * Copyright 2016 @huxpro
 * Licensed under Apache 2.0
 * Register service worker.
 * ========================================================== */

const RUNTIME = 'docsify'
const HOSTNAME_WHITELIST = [
  self.location.hostname,
  'fonts.gstatic.com',
  'fonts.googleapis.com',
  'cdn.jsdelivr.net',
  'cdn.jsdmirror.com'
]

// 工具函数：修正 URL
const getFixedUrl = (req) => {
  var now = Date.now()
  var url = new URL(req.url)

  // 强制使用当前页面协议（避免混合内容）
  url.protocol = self.location.protocol

  // 本地资源加 cache-bust，避免缓存过久
  if (url.hostname === self.location.hostname) {
    url.search += (url.search ? '&' : '?') + 'cache-bust=' + now
  }
  return url.href
}

/**
 *  @Lifecycle Activate
 */
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

/**
 *  @Functional Fetch
 */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  const hostname = url.hostname

  // 1) 白名单资源：stale-while-revalidate
  if (HOSTNAME_WHITELIST.includes(hostname)) {
    const cached = caches.match(event.request)
    const fixedUrl = getFixedUrl(event.request)
    const fetched = fetch(fixedUrl, { cache: 'no-store' })
    const fetchedCopy = fetched.then(resp => resp.clone())

    event.respondWith(
      Promise.race([fetched.catch(_ => cached), cached])
        .then(resp => resp || fetched)
        .catch(_ => { /* 吃掉错误 */ })
    )

    event.waitUntil(
      Promise.all([fetchedCopy, caches.open(RUNTIME)])
        .then(([response, cache]) => response.ok && cache.put(event.request, response))
        .catch(_ => { /* 吃掉错误 */ })
    )
  }

  // 2) umami 统计脚本/数据：永远网络优先，不缓存
  else if (hostname === 'umami.acmsz.top') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // 即使离线也返回空响应，避免报错
        return new Response('', { status: 200, statusText: 'OK' })
      })
    )
  }

  // 3) 处理 JS 脚本：强制缓存并后台更新
  else if (event.request.url.endsWith('.js')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const networkFetch = fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(RUNTIME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        return cachedResponse || networkFetch
      })
    )
  }
})
