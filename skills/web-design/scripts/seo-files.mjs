#!/usr/bin/env node
// Write public/robots.txt and public/sitemap.xml from the site origin (web-quality.md SE-20).
//
//   seo-files.mjs [--root <project>]
//
// The origin is SITE_URL (or VITE_SITE_URL) from the environment or the project's .env.
// Paths come from web-design.config.json → site.sitemap (default ["/"]). Used by the Next.js
// template: route handlers can't be both static-exportable and Cache Components-compatible,
// so these files are generated before every build instead. (The Vite template does the same
// in its seo-files plugin.)

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, readConfig } from './lib/tokens.mjs';

const args = parseArgs(process.argv.slice(2));
const root = path.resolve(args.root ?? process.cwd());
const fromEnvFile = (key) => {
  const f = path.join(root, '.env');
  if (!fs.existsSync(f)) return undefined;
  return fs.readFileSync(f, 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim();
};
const site = (process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? fromEnvFile('SITE_URL') ?? fromEnvFile('VITE_SITE_URL') ?? '').replace(/\/$/, '');
if (!/^https?:\/\/[^/]+$/.test(site)) {
  console.error('Set SITE_URL in .env to the absolute site origin, e.g. https://example.com');
  process.exit(1);
}
const paths = readConfig(root).site?.sitemap ?? ['/'];
const pub = path.join(root, 'public');
fs.mkdirSync(pub, { recursive: true });
fs.writeFileSync(path.join(pub, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
fs.writeFileSync(path.join(pub, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${site}${p}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`wrote public/robots.txt and public/sitemap.xml for ${site} (${paths.length} paths)`);
