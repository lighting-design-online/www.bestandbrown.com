import { mkdir, readdir, readFile, rename, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = path.resolve('public/clone');
const TMP = path.join(ROOT, '.mirror');
const ROOT_URL = 'https://www.bestandbrown.com/';
const SITEMAP_INDEX = 'https://www.bestandbrown.com/sitemap.xml';
const TIMEOUT = '120';

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function extractLocs(xml) {
  const locs = [];
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    locs.push(match[1].trim());
  }
  return locs;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function normalizeUrl(url) {
  const u = new URL(url);
  if (u.hash) u.hash = '';
  return u.toString();
}

function pathForUrl(url) {
  const u = new URL(url);
  const pathname = u.pathname === '/' ? '/index.html' : u.pathname;
  return pathname.startsWith('/') ? pathname.slice(1) : pathname;
}

async function ensureDirFor(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function spawnWget(urlsFile) {
  await mkdir(ROOT, { recursive: true });
  return new Promise((resolve, reject) => {
    const args = [
      '--recursive',
      '--level=1',
      '--no-parent',
      '--page-requisites',
      '--convert-links',
      '--adjust-extension',
      '--no-host-directories',
      '--directory-prefix',
      ROOT,
      '--wait',
      '1',
      '--random-wait',
      '--tries',
      '1',
      '--timeout',
      TIMEOUT,
      '--read-timeout',
      TIMEOUT,
      '--user-agent',
      'Mozilla/5.0 (compatible; CodexMirror/1.0)',
      '--input-file',
      urlsFile,
    ];
    const child = spawn('wget', args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`wget exited with code ${code}`));
    });
  });
}

async function stripQueryFromNames(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const current = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await stripQueryFromNames(current);
      continue;
    }
    if (!entry.name.includes('?')) continue;
    const nextName = entry.name.split('?')[0];
    const next = path.join(dir, nextName);
    await ensureDirFor(next);
    try {
      await rename(current, next);
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }
}

async function rewriteFile(filePath, replacements) {
  const content = await readFile(filePath, 'utf8');
  let next = content;
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
  }
  if (next !== content) {
    await writeFile(filePath, next);
  }
}

async function rewriteTextFiles(dir, replacements) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const current = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await rewriteTextFiles(current, replacements);
      continue;
    }
    if (!/\.(html?|css|js|xml|txt|json|webmanifest|svg)$/i.test(entry.name)) continue;
    await rewriteFile(current, replacements);
  }
}

async function main() {
  await mkdir(TMP, { recursive: true });

  const sitemapIndex = await fetchText(SITEMAP_INDEX);
  const sitemapUrls = extractLocs(sitemapIndex);
  const pageUrls = [ROOT_URL];
  for (const sitemapUrl of sitemapUrls) {
    const xml = await fetchText(sitemapUrl);
    pageUrls.push(...extractLocs(xml));
  }

  const urls = unique(pageUrls.map(normalizeUrl));
  const urlsFile = path.join(TMP, 'urls.txt');
  await writeFile(urlsFile, urls.join('\n') + '\n');

  console.log(`Seeded ${urls.length} URLs`);
  await spawnWget(urlsFile);

  await stripQueryFromNames(ROOT);

  const replacements = [
    ['https://www.bestandbrown.com', ''],
    ['http://www.bestandbrown.com', ''],
    ['https://bestandbrown.com', ''],
    ['http://bestandbrown.com', ''],
  ];
  await rewriteTextFiles(ROOT, replacements);

  console.log('Mirror complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
