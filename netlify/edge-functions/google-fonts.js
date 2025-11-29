import fetch from "node-fetch";

const ALLOWED_ORIGIN = "https://hw.acmsz.top"; // 替换为你的站点域名

export default async (request) => {
  const referer = request.headers.get("referer") || "";
  const origin = request.headers.get("origin") || "";

  // 只允许本站访问
  if (!referer.startsWith(ALLOWED_ORIGIN) && origin !== ALLOWED_ORIGIN) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const path = url.pathname + url.search;

  // Google Fonts CSS
  if (path.startsWith("/googleapis/")) {
    const targetUrl = "https://fonts.googleapis.com" + path.replace("/googleapis", "");
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": request.headers.get("user-agent") || "",
        "Accept": request.headers.get("accept") || "*/*",
      },
    });

    let cssText = await response.text();

    // 重写 CSS 内字体 URL
    cssText = cssText.replace(/https:\/\/fonts\.gstatic\.com\/([^\)]+)/g, (match, p1) => {
      return `/gstatic/${p1}`;
    });

    const headers = new Headers(response.headers);
    headers.set("Content-Type", "text/css; charset=utf-8");
    headers.set("Cache-Control", "public, max-age=31536000");
    headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);

    return new Response(cssText, { status: response.status, headers });
  }

  // Google Fonts 字体文件
  if (path.startsWith("/gstatic/")) {
    const targetUrl = "https://fonts.gstatic.com" + path.replace("/gstatic", "");
    const response = await fetch(targetUrl);

    const body = await response.arrayBuffer();
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "public, max-age=31536000");
    headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);

    return new Response(body, { status: response.status, headers });
  }

  return new Response("Not Found", { status: 404 });
};
