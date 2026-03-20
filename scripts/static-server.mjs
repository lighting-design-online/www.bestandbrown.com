import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const root = path.resolve(process.argv[2] || 'public/clone');
const port = Number(process.argv[3] || process.env.PORT || 4174);

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.pdf', 'application/pdf'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.webmanifest', 'application/manifest+json'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

function contentType(filePath, requestPath = '') {
  const typePath = filePath.split('?')[0];
  const byExt = mimeTypes.get(path.extname(typePath).toLowerCase());
  if (byExt) return byExt;
  if (requestPath.startsWith('/css/')) return 'text/css; charset=utf-8';
  if (requestPath.startsWith('/scripts/')) return 'text/javascript; charset=utf-8';
  return 'text/html; charset=utf-8';
}

async function resolveFile(requestPath) {
  const parsed = new url.URL(requestPath, 'http://localhost');
  const cleanPath = decodeURIComponent(parsed.pathname);
  const rawQuery = parsed.search ? parsed.search.slice(1) : '';
  const candidates = [];

  if (rawQuery) {
    const rawBase = path.join(root, cleanPath);
    candidates.push(`${rawBase}?${rawQuery}`);
    candidates.push(`${rawBase}?${rawQuery}.html`);
  }

  const joined = path.join(root, cleanPath);
  candidates.push(joined);
  if (!cleanPath.endsWith('.html')) {
    candidates.push(`${joined}.html`);
  }
  candidates.push(path.join(joined, 'index.html'));
  if (cleanPath === '/' || cleanPath === '') {
    candidates.unshift(path.join(root, 'index.html'));
  }

  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {
      // ignore
    }
  }
  return null;
}

createServer(async (req, res) => {
  try {
    const requestUrl = new url.URL(req.url, `http://${req.headers.host}`);
    const filePath = await resolveFile(req.url);
    if (!filePath) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType(filePath, requestUrl.pathname) });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(String(err?.stack || err));
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Serving ${root} on http://0.0.0.0:${port}`);
});
