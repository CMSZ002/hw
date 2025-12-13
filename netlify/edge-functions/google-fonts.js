export default async (request) => {
  const PRODUCTION_ORIGIN = "https://hw.acmsz.top"; // 替换成你的站点域名

  const referer = request.headers.get("referer") || "";
  const origin = request.headers.get("origin") || "";

  // 只允许本站访问
  if (!referer.startsWith(PRODUCTION_ORIGIN) && origin !== PRODUCTION_ORIGIN) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const path = url.pathname + url.search;

  // 代理 Google Fonts CSS
  if (path.startsWith("/googleapis/")) {
    const targetUrl = "https://fonts.googleapis.com" + path.replace("/googleapis", "");
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": request.headers.get("user-agent") || "",
        "Accept": request.headers.get("accept") || "*/*",
      },
    });

    let cssText = await response.text();

    // 重写 CSS 内字体 URL（改为带域名）
    cssText = cssText.replace(
      /https:\/\/fonts\.gstatic\.com\/([^\)]+)/g,
      (match, p1) => {
        return `${PRODUCTION_ORIGIN}/gstatic/${p1}`;
      }
    );

    const headers = new Headers();
    headers.set("Content-Type", "text/css; charset=utf-8");
    headers.set("Cache-Control", "public, max-age=31536000");
    headers.set("Access-Control-Allow-Origin", PRODUCTION_ORIGIN);

    return new Response(cssText, { status: 200, headers });
  }

  // 代理 Google Fonts 字体文件
  if (path.startsWith("/gstatic/")) {
    const targetUrl = "https://fonts.gstatic.com" + path.replace("/gstatic", "");
    const response = await fetch(targetUrl);
 
    const arrayBuffer = await response.arrayBuffer();  

    const headers = new Headers();
    headers.set("Cache-Control", "public, max-age=31536000");
    headers.set("Access-Control-Allow-Origin", PRODUCTION_ORIGIN);

    return new Response(arrayBuffer, { status: 200, headers });
  }

  return new Response("Not Found", { status: 404 });
};
