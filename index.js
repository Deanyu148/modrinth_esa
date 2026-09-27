export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 1. 处理 API 请求: /api/* -> https://api.modrinth.com/*
    if (url.pathname.startsWith('/api/')) {
      const targetPath = url.pathname.replace(/^\/api/, '');
      const targetUrl = new URL(targetPath + url.search, 'https://api.modrinth.com');

      const headers = new Headers(request.headers);
      headers.set('Host', 'api.modrinth.com');
      // Modrinth API 必须提供规范的 User-Agent
      if (!headers.get('User-Agent') || headers.get('User-Agent').includes('Cloudflare')) {
        headers.set('User-Agent', 'MyModrinthMirror/1.0 (contact@example.com)');
      }

      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });

      // 允许跨域（方便前端调用）
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }

    // 2. 处理 CDN 下载请求: /cdn/* -> https://cdn.modrinth.net/*
    if (url.pathname.startsWith('/cdn/')) {
      const targetPath = url.pathname.replace(/^\/cdn/, '');
      const targetUrl = new URL(targetPath + url.search, 'https://cdn.modrinth.net');

      const headers = new Headers(request.headers);
      headers.set('Host', 'cdn.modrinth.net');

      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: headers,
      });

      const newHeaders = new Headers(response.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      // 强缓存 mod 文件，提升二次命中率
      newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }

    // 默认回显或健康检查
    return new Response('Modrinth ESA Accelerator is running.', { status: 200 });
  }
};