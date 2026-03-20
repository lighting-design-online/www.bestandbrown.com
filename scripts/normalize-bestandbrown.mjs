import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('public/clone');
const TEXT_EXT = /\.(html?|css|js|xml|txt|json|webmanifest|svg)$/i;

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.mirror') continue;
      await walk(full);
      continue;
    }
    if (!TEXT_EXT.test(entry.name)) continue;
    let content = await readFile(full, 'utf8');
    const before = content;
    content = content
      .split('https://www.bestandbrown.com').join('')
      .split('http://www.bestandbrown.com').join('')
      .split('https://bestandbrown.com').join('')
      .split('http://bestandbrown.com').join('');
    content = content.replace(/<link rel="canonical" href="" \/>/g, '<link rel="canonical" href="/" />');
    content = content.replace(/<link rel="alternate" href="" hreflang="en-gb" \/>/g, '<link rel="alternate" href="/" hreflang="en-gb" />');
    if (content !== before) {
      await writeFile(full, content);
    }
  }
}

await walk(ROOT);
