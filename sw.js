/* ===========================================================
 * docsify sw.js  –  stale-while-revalidate + umami always online
 * ========================================================== */
const RUNTIME = 'docsify-v1';
const HOSTNAME_WHITELIST = [
  self.location.hostname,
  'fonts.gstatic.com',
  'fonts.googleapis.com',
  'cdn.jsdelivr.net',
  'umami.acmsz.top',
  'cdn.jsdmirror.com'
];

// ------------------- util -------------------
const getFixedUrl = (req) => {
  const url = new URL(req.url);
  // 1. 统一协议
  url.protocol = self.location.protocol;
  // 2. 给同源请求加 cache-bust 以防 http 缓存
  if (url.hostname === self.location.hostname) {
    url.search += (url.search ? '&' : '?') + 'cache-bust=' + Date.now();
  }
  return url.href;
};

// ------------------- lifecycle -------------------
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// ------------------- fetch -------------------
self.addEventListener('fetch', event => {
  const { hostname } = new URL(event.request.url);

  // 不在白名单内：直接放行
  if (!HOSTNAME_WHITELIST.includes(hostname)) return;

  // 1) umami 统计脚本/数据：永远网络优先，不缓存
  if (hostname === 'umami.acmsz.top') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request)) // 离线时兜底
    );
    return;
  }

  // 2) 其余白名单资源：标准 stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fixedUrl = getFixedUrl(event.request);
      const fetched = fetch(fixedUrl, { cache: 'no-store' });
      const fetchedCopy = fetched.then(r => r.clone());
  
      // 后台更新缓存 + 仅在资源确实更新时才通知页面
      event.waitUntil(
        fetchedCopy
          .then(res => {
            if (res.ok) {
              return caches.open(RUNTIME).then(c => c.put(event.request, res))
                .then(() => {
                  // 检查资源是否真的更新了
                  return caches.match(event.request).then(newCached => {
                    if (!newCached || !cached || newCached.headers.get('etag') !== cached.headers.get('etag')) {
                      return self.clients.matchAll()
                        .then(clients => clients.forEach(c =>
                          c.postMessage({ type: 'UPDATE_READY' })
                        ));
                    }
                  });
                });
            }
          })
          .catch(() => { })
      );
  
      return cached || fetched.catch(() => cached);
    })
  );
});