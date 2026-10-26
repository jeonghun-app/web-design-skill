#!/usr/bin/env node
// Write public/robots.txt and public/sitemap.xml from the site origin (web-quality.md SE-20).
//
//   seo-files.mjs [--root <project>]      or      import { writeSeoFiles } from './seo-files.mjs'
//
// The Next.js template calls writeSeoFiles() from next.config.ts, so every `next build` and
// `next dev` writes them, whoever runs the build. Route handlers can't serve both the static
// export and Cache Components. Next has loaded .env, .env.production and .env.local into
// process.env by then, so the origin matches metadataBase. Paths come from
// web-design.config.json → site.sitemap (default ["/"]).

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs, readConfig } from './lib/tokens.mjs';

export function writeSeoFiles(root, env = process.env) {
  const fromEnvFile = (key) => {
    const f = path.join(root, '.env');
    return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim() : undefined;
  };
  const site = (env.SITE_URL ?? env.VITE_SITE_URL ?? fromEnvFile('SITE_URL') ?? fromEnvFile('VITE_SITE_URL') ?? '').replace(/\/$/, '');
  if (!/^https?:\/\/[^/]+$/.test(site)) throw new Error('Set SITE_URL in .env to the absolute site origin, e.g. https://example.com');
  const paths = readConfig(root).site?.sitemap ?? ['/'];
  const pub = path.join(root, 'public');
  fs.mkdirSync(pub, { recursive: true });
  const write = (name, body) => {
    const f = path.join(pub, name);
    if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== body) fs.writeFileSync(f, body);
  };
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${site}${p}</loc></url>`).join('\n')}\n</urlset>\n`);
  return { site, paths };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  try {
    const { site, paths } = writeSeoFiles(path.resolve(args.root ?? process.cwd()));
    console.log(`wrote public/robots.txt and public/sitemap.xml for ${site} (${paths.length} paths)`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
