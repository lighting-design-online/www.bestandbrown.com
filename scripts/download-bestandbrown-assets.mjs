import { readFile, readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('public/clone');
const ORIGIN = 'https://www.bestandbrown.com';
const TEXT_EXT = /\.(html?|css|js|xml|txt|json|webmanifest|svg)$/i;

function fileUrlPath(filePath) {
  return '/' + path.relative(ROOT, filePath).split(path.sep).join('/');
}

function extractUrls(text) {
  const urls = [];
  for (const match of text.matchAll(/(?:src|href|action)=["']([^"']+)["']/gi)) {
    urls.push(match[1]);
  }
  for (const match of text.matchAll(/url\(([^)]+)\)/gi)) {
    urls.push(match[1].trim().replace(/^["']|["']$/g, ''));
  }
  return urls;
}

function resolveAsset(ref, baseFilePath) {
  if (!ref) return null;
  if (ref === '/' || ref === '') return null;
  if (ref.startsWith('data:') || ref.startsWith('javascript:') || ref.startsWith('#')) return null;
  if (ref.startsWith('//')) return null;
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    if (!ref.startsWith(ORIGIN)) return null;
    const u = new URL(ref);
    return u.pathname + u.search;
  }
  const baseUrl = new URL(fileUrlPath(baseFilePath), ORIGIN);
  try {
    const resolved = new URL(ref, baseUrl);
    if (resolved.origin !== ORIGIN) return null;
    const assetPath = resolved.pathname + resolved.search;
    if (!isAssetPath(assetPath, ref)) return null;
    return assetPath;
  } catch {
    return null;
  }
}

function isAssetPath(assetPath, originalRef) {
  if (/\.(png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot|css|js|webmanifest|json|mp4|webm|pdf)$/i.test(assetPath)) {
    return true;
  }
  return (
    assetPath.startsWith('/images/') ||
    assetPath.startsWith('/content/') ||
    assetPath.startsWith('/views/') ||
    assetPath.startsWith('/dist/') ||
    assetPath.startsWith('/scripts/') ||
    assetPath.startsWith('/css/') ||
    assetPath.startsWith('/fonts/') ||
    assetPath.startsWith('/static/') ||
    assetPath.startsWith('/assets/') ||
    /font/i.test(originalRef)
  );
}

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.mirror') continue;
      await walk(full, files);
      continue;
    }
    if (!TEXT_EXT.test(entry.name)) continue;
    files.push(full);
  }
  return files;
}

async function download(urlPath) {
  const target = path.join(ROOT, urlPath.startsWith('/') ? urlPath.slice(1) : urlPath);
  try {
    const info = await stat(target);
    if (info.isFile()) return;
  } catch {
    // continue
  }

  const url = `${ORIGIN}${urlPath}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed ${res.status} for ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buf);
}

const files = await walk(ROOT);
const assets = new Set();

for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const ref of extractUrls(text)) {
    const asset = resolveAsset(ref, file);
    if (asset) assets.add(asset);
  }
}

console.log(`Found ${assets.size} asset references`);

const queue = [...assets];
const concurrency = 8;
let index = 0;

async function worker() {
  while (index < queue.length) {
    const current = queue[index++];
    try {
      await download(current);
    } catch (err) {
      console.error(`Asset download failed for ${current}: ${err.message}`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

console.log('Asset download complete');
