#!/usr/bin/env node
// Human-factors audit of a running page. Rule IDs refer to references/principles.md.
//
//   audit.mjs [--url http://localhost:5173/] [--root <project>] [--trends active|all|a,b]
//             [--themes light,dark] [--pages /,/#/app] [--out design/audit] [--no-shots]
//
// Pages default to config.audit.pages (design/web-design.config.json), else "/".
//
// Without --url it builds the project and serves dist/ itself (vite preview).
// Needs @playwright/test and @axe-core/playwright in the project (the template has them).
// Writes <out>/report.json, <out>/report.md and <out>/contact-sheet.html. Exit 1 on any MUST failure.

import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { parseArgs, readConfig, listTrends } from './lib/tokens.mjs';

const args = parseArgs(process.argv.slice(2));
const root = path.resolve(args.root ?? process.cwd());
const out = path.resolve(root, args.out ?? 'design/audit');
const require = createRequire(path.join(root, 'package.json'));
const { chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const VIEWPORTS = [
  { id: 'mobile', width: 375, height: 812, touch: true },
  { id: 'tablet', width: 768, height: 1024, touch: true },
  { id: 'desktop', width: 1440, height: 900, touch: false },
];
const config = readConfig(root);
const trendIds = (() => {
  const t = args.trends ?? 'active';
  if (t === 'active') return [config.trend];
  if (t === 'all') {
    // Only trends whose CSS actually ships in this build.
    const ids = listTrends(root).map((x) => x.id);
    if (config.include === 'active') return [config.trend];
    return ['none', ...(Array.isArray(config.include) ? ids.filter((id) => config.include.includes(id)) : ids)];
  }
  return String(t).split(',');
})();
const themes = String(args.themes ?? 'light,dark').split(',');
// With --url and no --pages, audit exactly that URL. Page paths resolve against the
// URL's own path (so --url http://host/docs/ --pages /,/#/app stays under /docs/).
const pages = args.pages ? String(args.pages).split(',') : args.url ? [''] : config.audit?.pages ?? ['/'];
const pageId = (p) => (p === '/' || p === '' ? 'home' : p.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, ''));
const resolvePage = (p, base) => (p === '' ? base : new URL(p.replace(/^\//, ''), base.endsWith('/') ? base : `${base}/`).href);

let server;
async function ensureServer() {
  if (args.url) return args.url;
  const r = spawnSync('npx', ['vite', 'build'], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
  const port = 4300 + Math.floor(Math.random() * 500);
  server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
  const url = `http://localhost:${port}/`;
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(url)).ok) return url; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('preview server did not start');
}

// Runs inside the page. Returns raw measurements; thresholds are applied in Node.
function probe(opts) {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('[data-wd-dev]');
  };
  const sel = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const txt = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${id}${txt ? ` "${txt}"` : ''}`;
  };
  const res = {};

  // MO-01 / MO-02: target size including ::before hit-area extensions.
  const targets = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=radio], [role=checkbox], [role=menuitem]')].filter(vis);
  res.targets = targets.map((el) => {
    // A wrapping <label> is part of the hit area for form controls.
    const hit = el.matches('input, select, textarea') && el.closest('label') ? el.closest('label') : el;
    const r = hit.getBoundingClientRect();
    const b = getComputedStyle(el, '::before');
    const bw = b.content !== 'none' && b.position === 'absolute' ? parseFloat(b.width) || 0 : 0;
    const bh = b.content !== 'none' && b.position === 'absolute' ? parseFloat(b.height) || 0 : 0;
    const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.closest('p, li') && (el.closest('p, li').textContent.length > el.textContent.length + 10);
    return { sel: sel(el), w: Math.max(r.width, bw), h: Math.max(r.height, bh), x: r.x + r.width / 2, y: r.y + r.height / 2 + scrollY, inline };
  });

  // TY-01 / TY-02 / TY-03: body text size, measure, leading.
  res.text = [...document.querySelectorAll('p, li, dd, blockquote, figcaption')].filter(vis).filter((el) => (el.textContent || '').trim().length > 60).map((el) => {
    const s = getComputedStyle(el);
    const fs = parseFloat(s.fontSize);
    const lh = s.lineHeight === 'normal' ? fs * 1.2 : parseFloat(s.lineHeight);
    const lines = Math.round(el.getBoundingClientRect().height / lh);
    // Characters per full line, measured from the real line boxes: count characters
    // on each rendered line (by y position of each character's rect) and take the longest.
    const range = document.createRange();
    const perLine = new Map();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      for (let i = 0; i < n.textContent.length; i++) {
        range.setStart(n, i);
        range.setEnd(n, i + 1);
        const r = range.getClientRects()[0];
        if (!r) continue;
        const y = Math.round(r.top);
        perLine.set(y, (perLine.get(y) ?? 0) + 1);
      }
    }
    const cpl = Math.max(0, ...perLine.values());
    const hangul = /[가-힣]/.test(el.textContent);
    const cjk = hangul || /[一-鿿぀-ヿ]/.test(el.textContent);
    return { sel: sel(el), fontSize: fs, ratio: lh / fs, lines, cpl, cjk, hangul, align: s.textAlign };
  });
  res.minFont = Math.min(...[...document.querySelectorAll('body *')].filter((el) => vis(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((el) => parseFloat(getComputedStyle(el).fontSize)));

  // LA-01 / LA-04 / MO-05: primary CTAs.
  const primaries = [...document.querySelectorAll('[data-slot=button][data-variant=solid]')].filter(vis);
  res.primaries = primaries.map((el) => {
    const r = el.getBoundingClientRect();
    let fixed = false;
    for (let a = el; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).position === 'fixed') { fixed = true; break; }
    return { sel: sel(el), top: fixed ? r.top : r.top + scrollY, cy: r.top + r.height / 2 + (fixed ? 0 : scrollY), inMain: !!el.closest('main'), inHeader: !!el.closest('header'), fixedBottom: fixed && r.top > innerHeight * 0.6 };
  });
  res.innerHeight = innerHeight;

  // LA-06: complexity budget.
  const textEls = [...document.querySelectorAll('body *')].filter((el) => vis(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  res.families = [...new Set(textEls.map((el) => getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim()))];
  res.weights = [...new Set(textEls.map((el) => getComputedStyle(el).fontWeight))];

  // LA-08: reflow.
  res.scrollWidth = document.documentElement.scrollWidth;
  res.clientWidth = document.documentElement.clientWidth;

  // MT-01 / MT-05: durations and infinite animations.
  const toMs = (v) => v.split(',').map((x) => (x.trim().endsWith('ms') ? parseFloat(x) : parseFloat(x) * 1000));
  res.motion = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('[data-wd-dev], [data-slot="skeleton"], [aria-busy="true"], [role="progressbar"], [role="status"]')) continue;
    const s = getComputedStyle(el);
    const t = Math.max(...toMs(s.transitionDuration));
    const a = Math.max(...toMs(s.animationDuration));
    if (t > 500 || a > 500 || (s.animationIterationCount.includes('infinite') && s.animationName !== 'none')) {
      res.motion.push({ sel: sel(el), transition: t, animation: a, infinite: s.animationIterationCount.includes('infinite') && s.animationName !== 'none', property: s.transitionProperty });
    }
  }
  if (opts.reduced) {
    res.reducedViolations = [...document.querySelectorAll('body *')].filter((el) => {
      const s = getComputedStyle(el);
      return Math.max(...toMs(s.transitionDuration)) > 20 && /transform|translate|scale|rotate|all/.test(s.transitionProperty);
    }).map(sel).slice(0, 10);
  }

  // TY-05: zoom must not be disabled.
  const vpMeta = document.querySelector('meta[name="viewport"]')?.content ?? '';
  const maxScale = vpMeta.match(/maximum-scale\s*=\s*([\d.]+)/)?.[1];
  res.zoomBlocked = /user-scalable\s*=\s*(no|0)/.test(vpMeta) || (maxScale !== undefined && +maxScale < 2);

  // CG-07: vague link or button labels without an accessible name that adds scent.
  const VAGUE = /^(click here|here|read more|learn more|more|details|link|go)$/i;
  res.vague = [...document.querySelectorAll('a[href], button')].filter(vis).filter((el) => {
    const name = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ');
    return VAGUE.test(name);
  }).map(sel);

  // TR-03: broken images.
  res.brokenImages = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src);
  return res;
}

const findings = [];
const add = (rule, level, ctx, msg, items = []) => findings.push({ rule, level, ...ctx, msg, items: items.slice(0, 8) });

function judge(m, ctx) {
  const vp = VIEWPORTS.find((v) => v.id === ctx.viewport);
  const small = m.targets.filter((t) => !t.inline && (t.w < 24 || t.h < 24));
  const tooClose = small.filter((t) => m.targets.some((o) => o !== t && Math.hypot(o.x - t.x, o.y - t.y) < 24));
  if (tooClose.length) add('MO-01', 'MUST', ctx, 'targets under 24px with a neighbour closer than 24px', tooClose.map((t) => `${t.sel} ${t.w.toFixed(0)}×${t.h.toFixed(0)}`));
  if (vp.touch) {
    const sub44 = m.targets.filter((t) => !t.inline && (t.w < 44 || t.h < 44));
    if (sub44.length) add('MO-02', 'SHOULD', ctx, 'touch targets under 44×44px', sub44.map((t) => `${t.sel} ${t.w.toFixed(0)}×${t.h.toFixed(0)}`));
  }
  const smallBody = m.text.filter((t) => t.fontSize < 16 && t.lines > 2);
  if (smallBody.length) add('TY-01', 'SHOULD', ctx, 'multi-line body text under 16px', smallBody.map((t) => `${t.sel} ${t.fontSize}px`));
  if (m.minFont < 12) add('TY-01', 'SHOULD', ctx, `smallest text is ${m.minFont}px (< 12px)`);
  const limit = (t) => (t.hangul ? 45 : t.cjk ? 40 : 80);
  const long = m.text.filter((t) => t.lines > 1 && t.cpl > limit(t));
  if (long.length) add('TY-02', 'SHOULD', ctx, 'lines longer than 80 characters (45 for Hangul, 40 for Japanese/Chinese)', long.map((t) => `${t.sel} ~${t.cpl.toFixed(0)} cpl`));
  const tight = m.text.filter((t) => t.lines > 1 && (t.ratio < 1.35 || t.ratio > 1.8) && t.fontSize < 24);
  if (tight.length) add('TY-03', 'SHOULD', ctx, 'body line-height outside 1.35–1.8', tight.map((t) => `${t.sel} ${t.ratio.toFixed(2)}`));
  const centered = m.text.filter((t) => t.align === 'center' && t.lines > 3);
  if (centered.length) add('TY-06', 'SHOULD', ctx, 'centered text longer than 3 lines', centered.map((t) => t.sel));

  const mainPrimaries = m.primaries.filter((p) => p.inMain);
  const slices = new Map();
  for (const p of mainPrimaries) {
    const k = Math.floor(p.top / m.innerHeight);
    slices.set(k, [...(slices.get(k) ?? []), p]);
  }
  const crowded = [...slices.values()].filter((s) => s.length > 1);
  if (crowded.length) add('LA-01', 'SHOULD', ctx, 'more than one solid (primary) button within one viewport height', crowded.flat().map((p) => p.sel));
  // A sticky bottom action bar counts as the primary CTA location (MO-05).
  const firstCta = [...mainPrimaries, ...m.primaries.filter((p) => p.fixedBottom && !p.inMain)].sort((a, b) => a.top - b.top)[0];
  if (!firstCta) add('LA-04', 'SHOULD', ctx, 'no primary CTA found in <main>');
  else if (firstCta.top > m.innerHeight) add('LA-04', 'SHOULD', ctx, `first primary CTA starts at ${firstCta.top.toFixed(0)}px, below the first viewport (${m.innerHeight}px)`);
  if (vp.id === 'mobile' && firstCta && !firstCta.fixedBottom && firstCta.cy < m.innerHeight * 0.25) add('MO-05', 'SHOULD', ctx, 'first primary CTA sits in the top quarter of the mobile screen');

  const fam = m.families.filter((f) => !/mono|code|courier/i.test(f));
  if (fam.length > 2) add('LA-06', 'SHOULD', ctx, `${fam.length} text font families (budget 2)`, fam);
  if (m.weights.length > 4) add('LA-06', 'SHOULD', ctx, `${m.weights.length} font weights (budget 3–4)`, m.weights);

  if (m.motion.length) {
    const slow = m.motion.filter((x) => x.transition > 500 || x.animation > 500);
    const inf = m.motion.filter((x) => x.infinite);
    if (slow.length) add('MT-01', 'SHOULD', ctx, 'transitions/animations longer than 500ms', slow.map((x) => `${x.sel} ${Math.max(x.transition, x.animation)}ms`));
    if (inf.length) add('MT-05', 'SHOULD', ctx, 'infinite animations outside loaders', inf.map((x) => x.sel));
  }
  if (m.reducedViolations?.length) add('MT-03', 'MUST', ctx, 'spatial transitions still run with prefers-reduced-motion', m.reducedViolations);
  if (m.brokenImages.length) add('TR-03', 'SHOULD', ctx, 'broken images', m.brokenImages);
  if (m.zoomBlocked) add('TY-05', 'MUST', ctx, 'viewport meta blocks zoom (user-scalable=no or maximum-scale < 2)');
  if (m.vague.length) add('CG-07', 'SHOULD', ctx, 'vague link/button labels ("Learn more", "Click here") without a descriptive accessible name', m.vague);
}

// TY-04: WCAG 1.4.12 text-spacing override must not clip or hide text.
async function textSpacingCheck(page, ctx) {
  // Only report boxes that start clipping *because of* the override: anything already
  // overflowing, deliberately clamped (line-clamp) or truncated is not a TY-04 failure.
  const scan = () => page.evaluate(() => {
    const out = {};
    let i = 0;
    for (const el of document.querySelectorAll('body *')) {
      i++;
      if (el.closest('[data-wd-dev]')) continue;
      const s = getComputedStyle(el);
      const clips = ['hidden', 'clip'].includes(s.overflowY) || ['hidden', 'clip'].includes(s.overflowX);
      if (!clips || !el.textContent.trim() || el.children.length > 3) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 2 || r.height <= 2 || s.clip === 'rect(0px, 0px, 0px, 0px)' || s.clipPath === 'inset(50%)') continue; // sr-only
      if (s.webkitLineClamp !== 'none' && s.webkitLineClamp !== '') continue;
      if (s.textOverflow === 'ellipsis') continue;
      if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) {
        el.dataset.wdTy04 ??= String(i);
        out[el.dataset.wdTy04] = `${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}"`;
      }
    }
    return out;
  });
  const before = await scan();
  await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
  await page.waitForTimeout(100);
  const after = await scan();
  const clipped = Object.entries(after).filter(([k]) => !(k in before)).map(([, v]) => v).slice(0, 10);
  if (clipped.length) add('TY-04', 'MUST', ctx, 'text clipped when text spacing is increased (WCAG 1.4.12)', clipped);
}

async function focusCheck(page, ctx) {
  // FK-01 / FK-03: tab through the first 25 stops; each must change pixels and stay uncovered.
  const failures = [];
  const covered = [];
  await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      // Compare focused vs unfocused styles: a resting box-shadow is not a focus indicator.
      const look = () => {
        const s = getComputedStyle(el);
        return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor, s.backgroundColor].join('|');
      };
      const focused = look();
      const s = getComputedStyle(el);
      const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
      el.blur();
      const rest = look();
      el.focus({ focusVisible: true });
      const visible = outline || focused !== rest;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + Math.min(r.height / 2, 8);
      const top = document.elementFromPoint(cx, cy);
      const hidden = top && !el.contains(top) && !top.contains(el) && ['fixed', 'sticky'].includes(getComputedStyle(top.closest('header, [style*="fixed"], nav') || top).position);
      const txt = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30);
      return { tag: el.tagName.toLowerCase(), txt, visible, hidden, dev: !!el.closest('[data-wd-dev]') };
    });
    if (!info || info.dev) continue;
    if (!info.visible) failures.push(`${info.tag} "${info.txt}"`);
    if (info.hidden) covered.push(`${info.tag} "${info.txt}"`);
  }
  if (failures.length) add('FK-01', 'MUST', ctx, 'focused elements with no visible indicator', failures);
  if (covered.length) add('FK-03', 'MUST', ctx, 'focused elements hidden under sticky/fixed content', covered);
}

const url = await ensureServer();
const browser = await chromium.launch();
const shots = [];
fs.mkdirSync(path.join(out, 'shots'), { recursive: true });
try {
  for (const pagePath of pages) {
  const target = resolvePage(pagePath, url);
  for (const trend of trendIds) {
    for (const theme of themes) {
      for (const vp of VIEWPORTS) {
        const ctx = { page: pageId(pagePath), trend, theme, viewport: vp.id };
        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.touch, isMobile: vp.touch && vp.width < 600 });
        await context.addInitScript(([th, tr]) => { localStorage.setItem('wd-theme', th); localStorage.setItem('wd-trend', tr); }, [theme, trend]);
        const page = await context.newPage();
        await page.goto(target, { waitUntil: 'networkidle' });
        await page.evaluate(async () => {
          // Trigger scroll-reveal content, then return to the top.
          for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
          scrollTo(0, 0);
        });
        await page.waitForTimeout(600);
        judge(await page.evaluate(probe, { reduced: false }), ctx);
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).exclude('[data-wd-dev]').analyze();
        for (const v of axe.violations) {
          add(`axe:${v.id}`, ['critical', 'serious'].includes(v.impact) ? 'MUST' : 'SHOULD', ctx, v.help, v.nodes.map((n) => n.target.join(' ')));
        }
        if (args['no-shots'] === undefined) {
          const file = path.join('shots', `${pageId(pagePath)}-${trend}-${theme}-${vp.id}.png`);
          await page.screenshot({ path: path.join(out, file), fullPage: vp.id !== 'tablet' });
          shots.push({ ...ctx, file });
        }
        if (vp.id === 'desktop') {
          await focusCheck(page, ctx);
          await textSpacingCheck(page, ctx); // last: it mutates the page styles
        }
        await context.close();
      }
      // LA-08 reflow at 320px and MT-03 reduced motion, once per trend/theme.
      const ctx = { page: pageId(pagePath), trend, theme, viewport: 'mobile' };
      const narrow = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce' });
      await narrow.addInitScript(([th, tr]) => { localStorage.setItem('wd-theme', th); localStorage.setItem('wd-trend', tr); }, [theme, trend]);
      const p = await narrow.newPage();
      await p.goto(target, { waitUntil: 'networkidle' });
      const m = await p.evaluate(probe, { reduced: true });
      if (m.scrollWidth > m.clientWidth + 1) add('LA-08', 'MUST', { ...ctx, viewport: '320' }, `horizontal scroll at 320px (scrollWidth ${m.scrollWidth})`);
      if (m.reducedViolations?.length) add('MT-03', 'MUST', { ...ctx, viewport: '320' }, 'spatial transitions still run with prefers-reduced-motion', m.reducedViolations);
      await narrow.close();
    }
  }
  }
} finally {
  await browser.close();
  server?.kill();
}

// Collapse identical findings across contexts.
const grouped = new Map();
for (const f of findings) {
  const k = `${f.rule}|${f.level}|${f.msg}`;
  const g = grouped.get(k) ?? { rule: f.rule, level: f.level, msg: f.msg, contexts: [], items: new Set() };
  g.contexts.push(`${f.page}:${f.trend}/${f.theme}/${f.viewport}`);
  f.items.forEach((i) => g.items.add(i));
  grouped.set(k, g);
}
const list = [...grouped.values()].map((g) => ({ ...g, items: [...g.items].slice(0, 10) })).sort((a, b) => (a.level === b.level ? a.rule.localeCompare(b.rule) : a.level === 'MUST' ? -1 : 1));
const must = list.filter((f) => f.level === 'MUST');

fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ url, trends: trendIds, themes, findings: list }, null, 2));
const md = [
  `# Audit report`, '', `Pages: ${pages.join(', ')} · Trends: ${trendIds.join(', ')} · Themes: ${themes.join(', ')} · Viewports: 320, 375, 768, 1440`, '',
  `**${must.length} MUST** · **${list.length - must.length} SHOULD**`, '',
  ...list.map((f) => `- **${f.level} ${f.rule}**: ${f.msg} _(in ${f.contexts.length} contexts: ${f.contexts.slice(0, 4).join(', ')}${f.contexts.length > 4 ? ', …' : ''})_${f.items.length ? '\n' + f.items.map((i) => `  - \`${i}\``).join('\n') : ''}`),
].join('\n');
fs.writeFileSync(path.join(out, 'report.md'), md + '\n');

const sheet = `<!doctype html><meta charset="utf-8"><title>Contact sheet</title>
<style>body{font:14px system-ui;margin:24px;background:#f4f4f5}h2{margin:32px 0 8px}div{display:flex;gap:12px;align-items:flex-start;overflow-x:auto}figure{margin:0;background:#fff;padding:8px;border-radius:8px}img{display:block;max-height:640px;width:auto;border:1px solid #ddd}figcaption{margin-top:4px;color:#555}</style>
${[...new Set(shots.map((s) => `${s.page} · ${s.trend}`))].map((t) => `<h2>${t}</h2><div>${shots.filter((s) => `${s.page} · ${s.trend}` === t).map((s) => `<figure><img src="${s.file}" loading="lazy"><figcaption>${s.theme} · ${s.viewport}</figcaption></figure>`).join('')}</div>`).join('\n')}`;
fs.writeFileSync(path.join(out, 'contact-sheet.html'), sheet);

console.log(md);
console.log(`\nreport: ${path.relative(root, path.join(out, 'report.md'))}  contact sheet: ${path.relative(root, path.join(out, 'contact-sheet.html'))}`);
process.exit(must.length ? 1 : 0);
