// Lab performance (PF) and SEO/share (SE) passes for audit.mjs. See references/web-quality.md.
// One pass per page: throttled like a mid-range phone on slow 4G (Lighthouse's mobile
// profile), cold cache. Lab numbers are regression signals, not field data.

export const MOBILE_SLOW_4G = { latency: 562.5, download: (1474.56 * 1024) / 8, upload: (675 * 1024) / 8, cpu: 4 };

export const DEFAULT_BUDGETS = { jsKb: 170, cssKb: 50, fontKb: 150, fontFiles: 4, totalKb: 1500, lcpMs: 2500, tbtMs: 200, cls: 0.1 };

const VITALS_INIT = () => {
  const V = (window.__vitals = { lcp: null, lcpEl: null, cls: 0, fcp: null, longtasks: [] });
  const po = (type, cb) => { try { new PerformanceObserver((l) => l.getEntries().forEach(cb)).observe({ type, buffered: true }); } catch { /* unsupported */ } };
  po('paint', (e) => { if (e.name === 'first-contentful-paint') V.fcp = e.startTime; });
  po('largest-contentful-paint', (e) => { V.lcp = e.startTime; V.lcpEl = e.element ? e.element.tagName.toLowerCase() + (e.element.id ? '#' + e.element.id : '') : null; window.__lcpNode = e.element; });
  // CLS: largest session window (gaps < 1 s, window < 5 s), excluding input-driven shifts.
  let win = 0, first = 0, last = 0;
  po('layout-shift', (e) => {
    if (e.hadRecentInput) return;
    if (win && e.startTime - last < 1000 && e.startTime - first < 5000) win += e.value;
    else { win = e.value; first = e.startTime; }
    last = e.startTime;
    V.cls = Math.max(V.cls, win);
  });
  po('longtask', (e) => V.longtasks.push({ start: e.startTime, dur: e.duration }));
};

export async function perfPass(browser, target, ctx, add, budgets = {}) {
  const B = { ...DEFAULT_BUDGETS, ...budgets };
  const context = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: MOBILE_SLOW_4G.latency, downloadThroughput: MOBILE_SLOW_4G.download, uploadThroughput: MOBILE_SLOW_4G.upload });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: MOBILE_SLOW_4G.cpu });
  await page.addInitScript(VITALS_INIT);
  const rows = [];
  page.on('requestfinished', async (r) => {
    const s = await r.sizes().catch(() => null);
    const res = await r.response().catch(() => null);
    rows.push({ url: r.url(), type: r.resourceType(), start: r.timing().startTime, bytes: s ? s.responseBodySize + s.responseHeadersSize : 0, enc: res?.headers()['content-encoding'] ?? null, ct: res?.headers()['content-type'] ?? '' });
  });
  const response = await page.goto(target, { waitUntil: 'load', timeout: 120000 });
  const loadAt = Date.now();
  const html = response ? await response.text().catch(() => '') : '';
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page.keyboard.press('Shift'); // trusted input finalizes LCP
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } });
  await page.waitForTimeout(800);

  const m = await page.evaluate(() => {
    const V = window.__vitals;
    const fcp = V.fcp ?? 0;
    const tbt = V.longtasks.filter((t) => t.start >= fcp).reduce((s, t) => s + Math.max(0, t.dur - 50), 0);
    const lcpNode = window.__lcpNode;
    const imgs = [...document.images].map((el) => {
      const r = el.getBoundingClientRect();
      const need = r.width * devicePixelRatio;
      return {
        src: (el.currentSrc || el.src).slice(0, 100), natural: el.naturalWidth, need: Math.round(need), rendered: r.width > 0,
        noDims: !(el.getAttribute('width') && el.getAttribute('height')) && !/\d/.test(getComputedStyle(el).aspectRatio),
        lazy: el.loading === 'lazy', fp: el.fetchPriority, isLcp: el === lcpNode, aboveFold: r.top + scrollY < innerHeight,
      };
    });
    const faces = [];
    for (const ss of document.styleSheets) {
      let rules; try { rules = ss.cssRules; } catch { faces.push({ crossOrigin: ss.href }); continue; }
      for (const r of rules) if (r instanceof CSSFontFaceRule) faces.push({ family: r.style.getPropertyValue('font-family'), display: r.style.getPropertyValue('font-display') || 'auto', src: r.style.getPropertyValue('src') });
    }
    // The async *property* is true for script-inserted scripts (force-async) even without the
    // attribute, so only parser-inserted classic scripts count as render-blocking.
    const blocking = [...document.querySelectorAll('head script[src]')].filter((s) => !s.async && !s.defer && s.type !== 'module' && !s.noModule).map((s) => s.src);
    return { fcp: V.fcp, lcp: V.lcp, lcpEl: V.lcpEl, cls: V.cls, tbt, imgs, faces, blocking, lcpIsImg: lcpNode?.tagName === 'IMG' };
  });
  await context.close();

  const kb = (n) => Math.round(n / 1024);
  const sum = (pred) => rows.filter(pred).reduce((s, r) => s + r.bytes, 0);
  // The JS budget is a critical-path budget: scripts requested before the load event.
  // Scripts deferred past load (idle-loaded features, interaction chunks) are reported separately.
  const bytes = { js: sum((r) => r.type === 'script' && r.start <= loadAt), jsDeferred: sum((r) => r.type === 'script' && r.start > loadAt), css: sum((r) => r.type === 'stylesheet'), font: sum((r) => r.type === 'font'), total: sum(() => true) };
  const fontFiles = rows.filter((r) => r.type === 'font').length;
  const local = /^https?:\/\/(localhost|127\.)/.test(target);

  if (m.lcp == null) add('PF-01', 'SHOULD', ctx, 'LCP was not reported');
  else if (m.lcp > 4000) add('PF-01', 'MUST', ctx, `LCP ${Math.round(m.lcp)} ms on slow 4G (> 4000 ms)`, [m.lcpEl ?? '?']);
  else if (m.lcp > B.lcpMs) add('PF-01', 'SHOULD', ctx, `LCP ${Math.round(m.lcp)} ms on slow 4G (> ${B.lcpMs} ms)`, [m.lcpEl ?? '?']);
  if (m.cls > B.cls) add('PF-02', 'MUST', ctx, `CLS ${m.cls.toFixed(3)} (> ${B.cls})`);
  if (m.tbt > 600) add('PF-03', 'MUST', ctx, `TBT ${Math.round(m.tbt)} ms at 4× CPU (> 600 ms)`);
  else if (m.tbt > B.tbtMs) add('PF-03', 'SHOULD', ctx, `TBT ${Math.round(m.tbt)} ms at 4× CPU (> ${B.tbtMs} ms)`);
  if (kb(bytes.js) > B.jsKb) add('PF-07', 'MUST', ctx, `JavaScript ${kb(bytes.js)} KB over the wire before load (budget ${B.jsKb} KB)`);
  if (kb(bytes.js + bytes.jsDeferred) > 2 * B.jsKb) add('PF-07', 'SHOULD', ctx, `JavaScript ${kb(bytes.js + bytes.jsDeferred)} KB in total including deferred chunks (over 2× the ${B.jsKb} KB budget)`);
  if (kb(bytes.css) > B.cssKb) add('PF-07', 'SHOULD', ctx, `CSS ${kb(bytes.css)} KB (budget ${B.cssKb} KB)`);
  if (kb(bytes.font) > B.fontKb) add('PF-07', 'SHOULD', ctx, `Fonts ${kb(bytes.font)} KB (budget ${B.fontKb} KB)`);
  if (kb(bytes.total) > B.totalKb) add('PF-07', 'SHOULD', ctx, `Page weight ${kb(bytes.total)} KB (budget ${B.totalKb} KB)`);
  const over = m.imgs.filter((i) => i.rendered && i.need > 0 && i.natural / i.need > 2);
  if (over.length) add('PF-08', 'SHOULD', ctx, 'images more than 2× larger than rendered', over.map((i) => `${i.src} ${i.natural}px for ${i.need}px`));
  const nodims = m.imgs.filter((i) => i.noDims);
  if (nodims.length) add('PF-09', 'MUST', ctx, 'images without width/height or aspect-ratio (layout shift)', nodims.map((i) => i.src));
  if (m.imgs.some((i) => i.isLcp && i.lazy)) add('PF-10', 'MUST', ctx, 'the LCP image is lazy-loaded');
  if (m.imgs.some((i) => i.isLcp && i.fp !== 'high')) add('PF-11', 'SHOULD', ctx, 'the LCP image has no fetchpriority="high"');
  const eager = m.imgs.filter((i) => !i.aboveFold && !i.lazy && i.rendered);
  if (eager.length) add('PF-13', 'SHOULD', ctx, 'below-the-fold images are not lazy-loaded', eager.map((i) => i.src));
  // Faces that only point at local() fonts (metric-adjusted fallbacks) never wait on the network.
  const localOnly = (f) => f.src && !/url\(/.test(f.src) && /local\(/.test(f.src);
  const badDisplay = m.faces.filter((f) => f.display && !/swap|optional|fallback/.test(f.display) && !localOnly(f));
  if (badDisplay.length) add('PF-14', 'MUST', ctx, 'font faces without font-display swap/optional/fallback', badDisplay.map((f) => f.family));
  if (fontFiles > B.fontFiles) add('PF-15', 'SHOULD', ctx, `${fontFiles} font files on first load (budget ${B.fontFiles})`);
  if (m.blocking.length) add('PF-18', 'MUST', ctx, 'render-blocking scripts in <head>', m.blocking);
  if (!local) {
    const raw = rows.filter((r) => /text|javascript|json|css|svg|xml/.test(r.ct) && r.bytes > 1024 && !r.enc);
    if (raw.length) add('PF-19', 'MUST', ctx, 'text responses served without compression', raw.map((r) => r.url));
  }
  return { lcp: m.lcp, cls: m.cls, tbt: m.tbt, fcp: m.fcp, bytes: Object.fromEntries(Object.entries(bytes).map(([k, v]) => [k, kb(v)])), fontFiles, htmlBytes: html.length };
}

const SEO_PROBE = () => {
  const $$ = (s) => [...document.querySelectorAll(s)];
  const meta = (sel) => document.querySelector(sel)?.getAttribute('content')?.trim() ?? null;
  const visible = (h) => h.checkVisibility?.() !== false && h.textContent.trim();
  let prev = 0;
  const skips = [];
  for (const h of $$('h1,h2,h3,h4,h5,h6').filter(visible)) {
    const l = +h.tagName[1];
    if (prev && l > prev + 1) skips.push(`h${prev}→h${l}: ${h.textContent.trim().slice(0, 40)}`);
    prev = l;
  }
  const lang = document.documentElement.lang;
  let langOk = false; try { langOk = !!(lang && Intl.getCanonicalLocales(lang)[0]); } catch { langOk = false; }
  const ld = $$('script[type="application/ld+json"]').map((s) => {
    try { const j = JSON.parse(s.textContent); const items = [].concat(j['@graph'] ?? j); return { ok: true, types: items.map((i) => i['@type']), ctx: /schema\.org/.test(JSON.stringify(j['@context'] ?? '')) }; }
    catch (e) { return { ok: false, err: String(e.message).slice(0, 60) }; }
  });
  const c = document.createElement('canvas').getContext('2d');
  c.font = '20px Arial';
  return {
    titles: $$('title').filter((t) => t.textContent.trim()).length,
    title: document.title.trim(), titlePx: Math.round(c.measureText(document.title.trim()).width),
    description: meta('meta[name=description]'),
    h1: $$('h1').filter(visible).length, skips,
    lang, langOk,
    viewport: /width=device-width/.test(meta('meta[name=viewport]') ?? ''),
    canonical: $$('link[rel=canonical]').map((l) => l.getAttribute('href')),
    robots: $$('meta[name=robots],meta[name=googlebot]').map((m) => m.content).filter((x) => /noindex|none/i.test(x)),
    og: Object.fromEntries(['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:image:width', 'og:image:height', 'og:image:alt'].map((p) => [p, meta(`meta[property="${p}"]`)])),
    twitter: meta('meta[name="twitter:card"]'),
    icons: $$('link[rel~=icon]').map((l) => ({ href: l.getAttribute('href'), type: l.type })),
    apple: !!document.querySelector('link[rel=apple-touch-icon]'),
    manifest: !!document.querySelector('link[rel=manifest]'),
    ld,
    jsLinks: $$('a').filter((a) => { const h = a.getAttribute('href'); return h === null || /^\s*(javascript:|#\s*$)/i.test(h); }).map((a) => a.outerHTML.slice(0, 80)),
    imgNoAlt: $$('img').filter((i) => !i.hasAttribute('alt') || /\.(jpe?g|png|webp|avif)$|^(img|image|photo)\d*$/i.test(i.alt)).map((i) => i.currentSrc || i.src),
  };
};

export async function seoPass(browser, target, ctx, add, { checkRobots = true } = {}) {
  // JS pass (what search engines render) and no-JS pass (what share crawlers read).
  const js = await browser.newContext();
  const p = await js.newPage();
  await p.goto(target, { waitUntil: 'networkidle' });
  const s = await p.evaluate(SEO_PROBE);
  const headers = (await p.goto(target).catch(() => null))?.headers() ?? {};
  const origin = new URL(target).origin;
  let robotsTxt = null, sitemapOk = null;
  if (checkRobots) {
    const rb = await p.request.get(origin + '/robots.txt').catch(() => null);
    robotsTxt = rb && rb.ok() && /text\/plain/.test(rb.headers()['content-type'] ?? '') ? await rb.text() : null;
    const smUrl = robotsTxt?.match(/^Sitemap:\s*(\S+)/im)?.[1] ?? origin + '/sitemap.xml';
    const sm = await p.request.get(smUrl.replace(/^https?:\/\/[^/]+/, origin)).catch(() => null);
    sitemapOk = !!(sm && sm.ok() && /<(urlset|sitemapindex)/.test(await sm.text()));
  }
  await js.close();
  const nojsCtx = await browser.newContext({ javaScriptEnabled: false });
  const q = await nojsCtx.newPage();
  await q.goto(target, { waitUntil: 'load' });
  const raw = await q.evaluate(SEO_PROBE);
  await nojsCtx.close();

  const cjk = /[가-힣一-鿿぀-ヿ]/.test(s.title + (s.description ?? ''));
  const len = (x) => [...(x ?? '')].length;
  if (s.titles !== 1) add('SE-01', 'MUST', ctx, `${s.titles} non-empty <title> elements (need exactly 1)`);
  else if (cjk ? len(s.title) > 32 || len(s.title) < 8 : s.titlePx > 600 || len(s.title) < 15) add('SE-02', 'SHOULD', ctx, `title length ${len(s.title)} chars / ${s.titlePx}px`, [s.title]);
  if (!s.description) add('SE-03', 'MUST', ctx, 'no meta description');
  else if (cjk ? len(s.description) < 40 || len(s.description) > 90 : len(s.description) < 70 || len(s.description) > 160) add('SE-04', 'SHOULD', ctx, `meta description ${len(s.description)} chars`);
  if (s.h1 !== 1) add('SE-05', 'MUST', ctx, `${s.h1} visible <h1> elements (need exactly 1)`);
  if (s.skips.length) add('SE-06', 'SHOULD', ctx, 'heading levels skip', s.skips);
  if (!s.langOk) add('SE-07', 'MUST', ctx, `<html lang> missing or invalid (${s.lang || 'none'})`);
  if (!s.viewport) add('SE-08', 'MUST', ctx, 'no width=device-width viewport meta');
  if (s.canonical.length !== 1 || !/^https?:\/\//.test(s.canonical[0] ?? '')) add('SE-09', 'MUST', ctx, 'need exactly one absolute rel=canonical', s.canonical);
  const xrt = headers['x-robots-tag'] ?? '';
  if (s.robots.length || /noindex|none/i.test(xrt)) add('SE-10', 'MUST', ctx, 'page is set to noindex', [...s.robots, xrt].filter(Boolean));
  const ogMissing = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'].filter((k) => !raw.og[k]);
  if (ogMissing.length) add('SE-11', 'MUST', ctx, 'Open Graph tags missing from the HTML (share crawlers run no JS)', ogMissing);
  else if (!/^https:\/\//.test(raw.og['og:image'])) add('SE-11', 'MUST', ctx, 'og:image must be an absolute https URL', [raw.og['og:image']]);
  if (!raw.og['og:image:width'] || !raw.og['og:image:height'] || !raw.og['og:image:alt']) add('SE-12', 'SHOULD', ctx, 'og:image:width/height/alt not set (1200×630 recommended)');
  if (!raw.twitter) add('SE-13', 'SHOULD', ctx, 'no twitter:card (use summary_large_image)');
  if (!s.icons.some((i) => /\.(png|ico)(\?|$)/i.test(i.href ?? '') || /png|icon/.test(i.type))) add('SE-14', 'MUST', ctx, 'no PNG/ICO favicon (search results ignore SVG-only favicons)');
  if (!s.apple || !s.manifest) add('SE-14', 'SHOULD', ctx, 'apple-touch-icon or web manifest missing');
  const ldBad = s.ld.filter((l) => !l.ok || !l.ctx || !l.types?.every(Boolean));
  if (ldBad.length) add('SE-15', 'MUST', ctx, 'invalid JSON-LD block', ldBad.map((l) => l.err ?? 'missing @context/@type'));
  const types = s.ld.flatMap((l) => l.types ?? []);
  if (ctx.page === 'home' && !(types.includes('Organization') && types.includes('WebSite'))) add('SE-16', 'SHOULD', ctx, 'home page lacks Organization + WebSite structured data');
  if (types.some((t) => t === 'FAQPage' || t === 'HowTo')) add('SE-18', 'SHOULD', ctx, 'FAQPage/HowTo markup no longer earns rich results; do not promise them');
  if (checkRobots) {
    if (!robotsTxt) add('SE-20', 'MUST', ctx, '/robots.txt missing or not text/plain');
    else if (/User-agent:\s*\*[\s\S]*?^Disallow:\s*\/\s*$/im.test(robotsTxt)) add('SE-20', 'MUST', ctx, 'robots.txt disallows the whole site');
    if (!sitemapOk) add('SE-20', 'SHOULD', ctx, 'no sitemap.xml');
  }
  if (s.jsLinks.length) add('SE-21', 'MUST', ctx, 'links without a real href (not crawlable)', s.jsLinks);
  if (s.imgNoAlt.length) add('SE-23', 'MUST', ctx, 'images without alt (or filename-like alt)', s.imgNoAlt);
  return { title: s.title, description: s.description, h1: s.h1 };
}
