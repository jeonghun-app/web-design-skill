#!/usr/bin/env node
// Regenerate the README images from the template's production build.
//
//   cd skills/web-design/template && npm run build && node ../../../docs/capture.mjs
//
// Writes docs/trends-light.jpg, docs/trends-dark.jpg, docs/illustrations.jpg, docs/app.jpg
// and docs/system.jpg. Montages are composed in the browser, so no image library is needed.

import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DOCS = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.join(DOCS, '..', 'skills', 'web-design', 'template');
const require = createRequire(path.join(TEMPLATE, 'package.json'));
const { chromium } = require('@playwright/test');
const trends = ['none', ...JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'src/design/trends.json'), 'utf8')).map((t) => t.id)];
const label = (t) => (t === 'none' ? 'base' : t);

if (!fs.existsSync(path.join(TEMPLATE, 'dist/index.html'))) throw new Error('Build the template first: npm run build');
const port = await new Promise((resolve) => { const s = net.createServer().listen(0, '127.0.0.1', () => { const { port: p } = s.address(); s.close(() => resolve(p)); }); });
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { cwd: TEMPLATE, stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid); } catch { /* gone */ } };
process.once('exit', stop);
const origin = `http://localhost:${port}`;
for (let i = 0; i < 100; i++) { try { if ((await fetch(origin)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 200)); }

const browser = await chromium.launch();

async function shot({ trend, theme, route = '', width = 1440, height = 1800, selector, scrollTo, wait = 1500 }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  await ctx.addInitScript((t) => localStorage.setItem('wd-theme', t), theme);
  const page = await ctx.newPage();
  await page.goto(`${origin}/?trend=${trend}${route}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Put a section's heading just under the sticky header.
  if (scrollTo) await page.evaluate((id) => scrollTo(0, document.getElementById(id).getBoundingClientRect().top + scrollY - 88), scrollTo);
  await page.waitForTimeout(wait); // entrance motion settles
  const buf = selector ? await page.locator(selector).first().screenshot() : await page.screenshot();
  await ctx.close();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

// Lay out tiles in a grid and screenshot that page as one JPEG.
async function montage(file, tiles, { cols, tileW, tileH, labelH = 40, fit = 'cover' }) {
  const rows = Math.ceil(tiles.length / cols);
  const W = cols * tileW, H = rows * (tileH + labelH);
  const html = `<!doctype html><style>
    body{margin:0;background:#2a2d33;font:600 26px/1 system-ui,sans-serif;letter-spacing:.02em}
    .g{display:grid;grid-template-columns:repeat(${cols},${tileW}px);width:${W}px}
    .t{width:${tileW}px;height:${tileH + labelH}px;overflow:hidden;background:#fff}
    .l{height:${labelH}px;display:flex;align-items:center;padding:0 16px;background:#f2f3f5;color:#16181d}
    img{display:block;width:${tileW}px;height:${tileH}px;object-fit:${fit};object-position:top}
  </style><div class="g">${tiles.map((t) => `<div class="t"><div class="l">${t.label}</div><img src="${t.src}"></div>`).join('')}</div>`;
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(DOCS, file), type: 'jpeg', quality: 82 });
  await page.close();
  console.log('wrote', file, `${W}×${H}`);
}

for (const theme of ['light', 'dark']) {
  const tiles = [];
  for (const t of trends) tiles.push({ label: `${label(t)}`, src: await shot({ trend: t, theme }) });
  await montage(`trends-${theme}.jpg`, tiles, { cols: 4, tileW: 480, tileH: 600 });
}

// Tile height follows the gallery's own aspect ratio, so there is no empty band.
const ratioOf = async (src) => { const p = await browser.newPage(); const r = await p.evaluate(async (u) => { const i = new Image(); i.src = u; await i.decode(); return i.height / i.width; }, src); await p.close(); return r; };
const illus = [];
for (const t of trends) for (const theme of ['light', 'dark']) {
  illus.push({ label: `${label(t)} · ${theme}`, src: await shot({ trend: t, theme, route: '#/system/illustration', width: 1280, height: 1000, selector: '#illustration ul[aria-label="Illustrations"]' }) });
}
await montage('illustrations.jpg', illus, { cols: 4, tileW: 480, tileH: Math.round(480 * (await ratioOf(illus[0].src))) });

await montage('app.jpg', [
  { label: '#/app · base · light · 1440', src: await shot({ trend: 'none', theme: 'light', route: '#/app', width: 1440, height: 900 }) },
  { label: '#/app · signal-dark · dark · 1440', src: await shot({ trend: 'signal-dark', theme: 'dark', route: '#/app', width: 1440, height: 900 }) },
], { cols: 2, tileW: 960, tileH: 600 });

await montage('system.jpg', [
  { label: '#/system · base · light', src: await shot({ trend: 'none', theme: 'light', route: '#/system', width: 1440, height: 1100 }) },
  { label: '#/system · warm-natural · light', src: await shot({ trend: 'warm-natural', theme: 'light', route: '#/system', scrollTo: 'components', width: 1440, height: 1100 }) },
], { cols: 2, tileW: 960, tileH: 733 });

await browser.close();
stop();
