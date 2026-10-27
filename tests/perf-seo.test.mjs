// perf-seo: the SEO pass on a complete head vs a bare SPA shell, and the perf pass on
// pages with known problems. Served from a local http server; no network needed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { blocksAll, perfPass, seoPass } from '../skills/web-design/scripts/lib/perf-seo.mjs';

const TEMPLATE = fileURLToPath(new URL('../skills/web-design/template', import.meta.url));
const require = createRequire(path.join(TEMPLATE, 'package.json'));
let chromium;
try { ({ chromium } = require('@playwright/test')); } catch { /* not installed */ }
const browserPath = chromium?.executablePath?.();
const skip = !chromium || !browserPath || !fs.existsSync(browserPath) ? 'playwright chromium not installed' : false;

const GOOD_HEAD = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lumen · The calm work queue for busy teams</title>
<meta name="description" content="Lumen sorts requests from chat, email and forms into one queue so the next right task is on top.">
<link rel="canonical" href="https://example.com/">
<link rel="icon" href="/favicon.png" type="image/png"><link rel="apple-touch-icon" href="/a.png"><link rel="manifest" href="/m.webmanifest">
<meta property="og:type" content="website"><meta property="og:title" content="Lumen"><meta property="og:description" content="One queue.">
<meta property="og:url" content="https://example.com/"><meta property="og:image" content="https://example.com/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Lumen">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"L"},{"@type":"WebSite","name":"L"}]}</script>`;

const PAGES = {
  '/good.html': `<!doctype html><html lang="en"><head>${GOOD_HEAD}</head><body><main><h1>Lumen</h1><p>Body copy.</p><a href="/about">About</a></main></body></html>`,
  // A typical client-rendered shell: everything arrives with JS, nothing for share crawlers.
  '/spa.html': `<!doctype html><html><head><title>App</title></head><body><div id="root"></div>
<script>document.getElementById('root').innerHTML = '<h1>Hi</h1><h3>Skip</h3><a href="#">More</a>';</script></body></html>`,
  '/perf.html': `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"><script src="/block.js"></script>
<style>@font-face{font-family:X;src:url(/x.woff2);font-display:block}</style></head>
<body><h1>Perf</h1><img src="/pixel.svg"></body></html>`,
  // JSON-LD as a top-level array is valid (SE-15); a CSS-sized image doesn't shift (PF-09).
  '/array-ld.html': `<!doctype html><html lang="en"><head>${GOOD_HEAD.replace(/<script type="application\/ld\+json">.*<\/script>/s, '')}
<script type="application/ld+json">[{"@context":"https://schema.org","@type":"Organization","name":"L"},{"@context":"https://schema.org","@type":"WebSite","name":"L"}]</script>
</head><body><main><h1>Lumen</h1></main></body></html>`,
  '/css-sized.html': `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"><style>.av{width:40px;height:40px}</style></head>
<body><h1>Avatars</h1><img class="av" src="/pixel.svg" alt=""></body></html>`,
  '/xfont.html': 'XFONT',
  '/block.js': '/* render-blocking */',
  '/pixel.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>',
  '/robots.txt': 'User-agent: *\nAllow: /\n',
};
const TYPES = { html: 'text/html', js: 'text/javascript', svg: 'image/svg+xml', txt: 'text/plain' };

let server, origin, browser, other, otherOrigin;
before(async () => {
  if (skip) return;
  server = http.createServer((req, res) => {
    const body = PAGES[req.url];
    if (body == null) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[req.url.split('.').pop()] });
    res.end(body);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${server.address().port}`;
  // A second origin serving a font stylesheet: its rules are unreadable through the CSSOM.
  other = http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/css', 'Access-Control-Allow-Origin': '*' }); res.end('@font-face{font-family:Blocky;src:url(/b.woff2);font-display:block}'); });
  await new Promise((r) => other.listen(0, 'localhost', r));
  otherOrigin = `http://localhost:${other.address().port}`;
  PAGES['/xfont.html'] = `<!doctype html><html lang="en"><head><link rel="stylesheet" href="${otherOrigin}/f.css"></head><body><h1 style="font-family:Blocky">X</h1></body></html>`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); other?.close(); });

const run = async (fn, url, opts) => {
  const found = [];
  await fn(browser, origin + url, { page: 'home' }, (id, level, _ctx, msg) => found.push(`${level} ${id}: ${msg}`), opts);
  return found;
};

test('SEO: a complete head passes', { skip }, async () => {
  assert.deepEqual(await run(seoPass, '/good.html', { checkRobots: false }), []);
});

test('SEO: a bare SPA shell fails the crawler checks', { skip }, async () => {
  const f = (await run(seoPass, '/spa.html', { checkRobots: true })).join('\n');
  for (const id of ['SE-03', 'SE-08', 'SE-09', 'SE-11', 'SE-14', 'SE-16', 'SE-21']) assert.match(f, new RegExp(`MUST ${id}|SHOULD ${id}`), `${id} missing in\n${f}`);
  assert.match(f, /SE-06/, 'heading skip h1→h3');
  assert.match(f, /SHOULD SE-20: no sitemap/);
  assert.doesNotMatch(f, /MUST SE-20/, 'robots.txt exists');
});

test('perf: blocking script, bad font-display and unsized image are caught', { skip, timeout: 120000 }, async () => {
  const f = (await run(perfPass, '/perf.html')).join('\n');
  assert.match(f, /MUST PF-18/);
  assert.match(f, /MUST PF-14/);
  assert.match(f, /MUST PF-09/);
});

test('SE-20: only the * group decides whether the whole site is blocked', () => {
  assert.equal(blocksAll('User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /\n'), false);
  assert.equal(blocksAll('User-agent: GPTBot\nUser-agent: *\nDisallow: /\n'), true);
  assert.equal(blocksAll('User-agent: *\nDisallow: /admin\n'), false);
  assert.equal(blocksAll('User-agent: *\nDisallow: / # everything\n'), true);
  assert.equal(blocksAll('User-agent: *\nDisallow: /*\n'), true);
});

test('SEO: JSON-LD as a top-level array is valid', { skip }, async () => {
  const f = (await run(seoPass, '/array-ld.html', { checkRobots: false })).join('\n');
  assert.doesNotMatch(f, /SE-15|SE-16/, f);
});

test('perf: CSS-sized images pass PF-09; cross-origin font-display:block fails PF-14', { skip, timeout: 120000 }, async () => {
  assert.doesNotMatch((await run(perfPass, '/css-sized.html')).join('\n'), /PF-09/);
  assert.match((await run(perfPass, '/xfont.html')).join('\n'), /MUST PF-14.*/);
});
