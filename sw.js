/* ===========================================================
 * docsify sw.js (改写版)
 * ===========================================================
 * Copyright 2016 @huxpro
 * Licensed under Apache 2.0
 * Register service worker.
 * ========================================================== */

const RUNTIME = 'docsify';
const HOSTNAME_WHITELIST = [
  self.location.hostname
];

/**
 * 生成缓存友好的 URL
 * 1. 修复协议
 * 2. 给本站内容加上 cache-bust
 */
const getFixedUrl = req => {
  const now = Date.now();
  const url = new URL(req.url);

  // 1. 修复 http/https 协议
  url.protocol = self.location.protocol;

  // 2. 给本站 URL 添加缓存破坏参数
  if (url.hostname === self.location.hostname) {
    url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;
  }
  return url.href;
};

/**
 * SW 激活阶段
 * 立即接管页面
 */
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

/**
 * 拦截 fetch 请求
 * - 白名单域名走 stale-while-revalidate
 * - 排除 Umami 等统计请求
 */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 排除第三方统计请求（如 Umami）
  if (url.hostname === 'umami.acmsz.top') {
    return;
  }

  // 仅处理白名单内的请求
  if (HOSTNAME_WHITELIST.includes(url.hostname)) {
    const cached = caches.match(event.request);
    const fixedUrl = getFixedUrl(event.request);
    const fetched = fetch(fixedUrl, { cache: 'no-store' });
    const fetchedCopy = fetched.then(resp => resp.clone());

    // RespondWith：先用 fetch 或缓存，保证离线可用
    event.respondWith(
      Promise.race([fetched.catch(() => cached), cached])
        .then(resp => resp || fetched)
        .catch(() => {
          /* 忽略错误 */
        }),
    );

    // 更新缓存
    event.waitUntil(
      Promise.all([fetchedCopy, caches.open(RUNTIME)])
        .then(([response, cache]) => response.ok && cache.put(event.request, response))
        .catch(() => {
          /* 忽略错误 */
        }),
    );
  }
});
