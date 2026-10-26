# Web quality: performance, SEO and sharing, code discipline, visual regression

A design is only as good as the page that loads on a mid-range phone, shows up in search and in a chat preview, and stays the same from one release to the next. This file defines the build-side rules. `audit.mjs` checks the PF, SE and VR rules in a real browser. `code-lint.mjs` checks the CL rules in the source before anything runs.

| Gate | Command | Runs in |
|---|---|---|
| Code discipline (CL) | `npm run lint:design` | `npm run build`, before `tsc` |
| Performance (PF) | `npm run audit` (skip with `--no-perf`) | one pass per page |
| SEO and sharing (SE) | `npm run audit` (skip with `--no-seo`) | the first page and every non-hash path |
| Visual regression (VR) | `npm run audit -- --baseline save` once, then `--baseline compare` | every screenshot |

## How the lab measures

The perf pass loads each page cold (cache disabled) at 412 × 823, DPR 1.75. The network is throttled to slow 4G (562.5 ms RTT, 1.47 Mbit/s down) and the CPU is slowed 4×. This is the same profile as the mobile lab run of the common page-speed tools. It then presses a key to finalize LCP, scrolls the page and reads LCP, CLS (largest session window), TBT (long tasks after FCP) and the bytes of every response.

Lab numbers are **regression signals, not field data**. If a project has real-user data (CrUX, RUM), that data wins. The lab tells you a change made things worse before users notice.

## Budgets

Defaults are below. Override per project in `design/web-design.config.json` → `audit.budgets`.

| Budget | Default | Why this number |
|---|---|---|
| `lcpMs` | 2500 | "Good" LCP threshold. MUST fails above 4000 ("poor"). |
| `cls` | 0.1 | "Good" CLS threshold |
| `tbtMs` | 200 | Lab proxy for INP. MUST fails above 600. |
| `jsKb` | 170 | Critical-path JS that a mid-range phone parses and runs in about 1 s. Counts compressed bytes **requested before the load event**. JS deferred past `load` is reported separately, and SHOULD fails if the total passes 2 × budget. |
| `cssKb` | 50 | CSS blocks first paint, so all of it is on the critical path. |
| `fontKb` / `fontFiles` | 150 / 4 | Each file is a request racing the LCP text. |
| `totalKb` | 1500 | Page weight on a metered connection |

```json
{ "audit": { "budgets": { "jsKb": 200, "lcpMs": 2000 } } }
```

**Framework floor.** The budget is for the whole first load, framework included. A Next.js App Router client runtime costs about 70 KB before any app code. Measured on the template, the near-static landing page is 170 KB in Next and 101 KB in Vite. Cache Components and Partial Prefetching don't change it. A Next project made by `new-project.mjs --framework next` therefore starts at `jsKb: 220`, which keeps the same headroom for app code on top of the floor. Choose Next for prerendered HTML, a much better LCP (1.6 s against 2.1–2.6 s on the template) and per-route SEO. Choose Vite when first-load JS on a low-end device matters most. Don't raise the budget further to fit a page. Move work out of the first load instead.

## Performance rules (PF)

| ID | Level | Rule | How the template meets it |
|---|---|---|---|
| PF-01 | MUST > 4 s, SHOULD > budget | LCP within budget on slow 4G | Fonts linked from the head; route chunks preloaded (PF-05); hero text needs no JS beyond the entry |
| PF-02 | MUST | CLS ≤ 0.1. The finding names the elements that moved. | Sized media, skeletons that reserve the final size, `font-display: swap` with a metric-matched fallback (`Inter Fallback` in `index.css`; `next/font` makes its own) |
| PF-03 | MUST > 600 ms, SHOULD > budget | TBT within budget | No heavy work at startup. Split work with `scheduler.yield()` or `setTimeout` if a task runs past 50 ms. |
| PF-05 | practice | **No request waterfalls on the critical path.** A lazy route's chunk must not wait for the entry to run. | The `route-preload` Vite plugin writes a tiny inline script that modulepreloads the current hash route's chunks in parallel with the entry. |
| PF-07 | MUST (JS), SHOULD (others) | Stay inside the byte budgets | Lazy routes; the motion engine loads after `load` (`src/lib/motion.tsx`, `LazyMotion strict`); providers live on the page that needs them (tooltip on `#/app`) |
| PF-08 | SHOULD | No image more than 2× its rendered pixel width | `srcset`/`sizes`, or export at 2× the largest rendered size |
| PF-09 | MUST | Every image has width and height, an aspect ratio, or a box fixed by CSS (`size-10`) | `width`/`height` attributes or an `aspect-*` class (also CL-08) |
| PF-10 | MUST | Never lazy-load the LCP image | `loading="lazy"` only below the fold |
| PF-11 | SHOULD | The LCP image has `fetchpriority="high"` | |
| PF-13 | SHOULD | Below-the-fold images are lazy-loaded | |
| PF-14 | MUST | Every `@font-face` uses `font-display: swap`, `optional` or `fallback`. Cross-origin stylesheets (Google Fonts, CDNs) are read from the responses. Faces that only use `local()` (metric fallbacks) are exempt. | Font URLs carry `display=swap` |
| PF-15 | SHOULD | ≤ 4 font files on first load | Variable fonts; one family for text, at most one for display |
| PF-16 | practice | **Fonts never chain behind CSS.** Link font stylesheets from the HTML head with `preconnect`. Don't `@import` them from the bundle. Load a trend's extra fonts only when that trend is on. | `build-tokens` writes `src/design/fonts.json`. The `design-fonts` plugin links the eager set, and `src/lib/trend-fonts.ts` loads the rest on demand. |
| PF-18 | MUST | No render-blocking scripts in `<head>` | Module scripts are deferred by default. Inline scripts stay tiny (theme, route preload). |
| PF-19 | MUST (deployed only) | Text responses are compressed (br/gzip) | Host setting. Skipped on localhost. |

Measured on the template (slow 4G, 4× CPU):

| Page | Vite before v0.4 | Vite v0.4 | Next.js v0.4 (prerendered) |
|---|---|---|---|
| home | LCP 2456 ms · JS 146 KB | LCP 2140 ms · JS 101 KB | LCP 1636 ms · JS 170 KB |
| app | LCP 3228 ms · JS 171 KB | LCP 2616 ms · JS 143 KB | LCP 1604 ms · JS 211 KB |
| system | LCP 3276 ms · JS 168 KB | LCP 2608 ms · JS 129 KB | LCP 1656 ms · JS 195 KB |

The remaining Vite LCP on the app routes is the floor of a client-rendered SPA: the HTML, then the JS, then execution, then paint. Getting under 2.5 s there needs HTML that arrives already rendered. The Next.js template prerenders every route, so the text paints before any JS runs. The trade is about 70 KB more JS (§ Budgets).

## SEO and sharing rules (SE)

The SEO pass runs twice. It runs once with JavaScript, as search engines render it, and once **without JavaScript**, as chat apps and social networks read share previews. Share tags that only appear after JS runs don't exist for share crawlers.

| ID | Level | Rule |
|---|---|---|
| SE-01 | MUST | Exactly one non-empty `<title>` |
| SE-02 | SHOULD | The title fits in a result line: ≤ 600 px at 20 px Arial and ≥ 15 characters. For CJK, 8–32 characters. |
| SE-03 | MUST | A meta description |
| SE-04 | SHOULD | Description length: 70–160 characters, or 40–90 for CJK |
| SE-05 | MUST | Exactly one visible `<h1>` |
| SE-06 | SHOULD | Heading levels don't skip (h1 → h3) |
| SE-07 | MUST | A valid `<html lang>` |
| SE-08 | MUST | A `width=device-width` viewport |
| SE-09 | MUST | Exactly one absolute `rel=canonical` |
| SE-10 | MUST | Not `noindex` (meta or `X-Robots-Tag`) unless that is intended. Accept it in config for staging. |
| SE-11 | MUST | `og:title`, `og:description`, `og:image`, `og:url` and `og:type` are present in the **raw HTML**. `og:image` is an absolute https URL. |
| SE-12 | SHOULD | `og:image:width`, `og:image:height` and `og:image:alt`. The image is 1200 × 630. |
| SE-13 | SHOULD | `twitter:card` = `summary_large_image` |
| SE-14 | MUST: PNG or ICO favicon. SHOULD: apple-touch-icon (180 px) and a web manifest | Search results don't show SVG-only favicons. |
| SE-15 | MUST | Every JSON-LD block parses and uses the schema.org context |
| SE-16 | SHOULD | The home page has `Organization` + `WebSite` structured data |
| SE-18 | SHOULD | Don't add `FAQPage`/`HowTo` markup to earn rich results; those results have been withdrawn for most sites. |
| SE-20 | MUST: `/robots.txt` exists as text/plain, and its `User-agent: *` group doesn't disallow `/`. `Disallow: /*` counts as blocking it too. Blocking a single crawler is fine. SHOULD: a sitemap |
| SE-21 | MUST | Every `<a>` has a real `href`. `href="#"` and `javascript:` links are not crawlable and break open-in-new-tab. |
| SE-23 | MUST | Every image has `alt`. A filename is not an alt. |

**How the template meets them.** `index.html` carries the full head. `VITE_SITE_URL` in `.env` (set by `new-project.mjs --site-url`) feeds the canonical URL, Open Graph URLs and JSON-LD ids. The `seo-files` Vite plugin generates `robots.txt` and `sitemap.xml` from the same origin, so they never point at the wrong host. In Next projects, `next.config.ts` calls `writeSeoFiles` (`scripts/seo-files.mjs`) on every build and dev start. It writes them into `public/` from `SITE_URL` (after Next has loaded `.env.local`/`.env.production`) and `site.sitemap` in the config. `public/` holds `favicon.png` (48), `apple-touch-icon.png` (180), `icon-192/512.png`, `manifest.webmanifest` and `og.png` (1200 × 630). Replace these with the brand's own. `theme-color` matches `color.bg` in light and dark.

**Hash routes are one document to a crawler.** `#/app` and `#/system` share the home page's head and canonical. That is fine for a demo or an app behind login. For pages that must rank on their own, use real paths with per-route metadata. The Next.js template does this.

## Code discipline rules (CL)

`code-lint.mjs` catches in seconds what would otherwise surface late in the browser audit or in review. It scans `src/**` and, in Next projects, `app/**` (except generated `src/design/`, tests and Code Connect templates), plus `index.html`. The build fails on any **E**.

| ID | Sev | Catches | Fix |
|---|---|---|---|
| CL-01 | E | Raw color literals (`#hex`, `rgb()`, `oklch()`…) outside token files. Hex containing a digit is always flagged. Letter-only hex (`#fff`, which looks like an id such as `#add`) is flagged in CSS or next to a color-ish name (fill, stroke, color, bg, fg, border, shadow, brand…). A bare `'#fff'` assigned to an unrelated name can slip through. | A semantic token |
| CL-02 | E | Tailwind default palette classes (`text-gray-500`). The palette is removed, so they silently do nothing. | A semantic utility |
| CL-03 | E | Arbitrary px, color or z values (`text-[13px]`, `bg-[#…]`, `z-[999]`) | The scale or a token |
| CL-04 | E | `outline-none` / `outline: none` without a focus-visible replacement | Keep the global ring |
| CL-05 | E | Actions on `onMouseDown`/`onPointerDown`/`onTouchStart` (except drag, resize, pan) | `onClick` |
| CL-06 | E | Positive `tabIndex` | Fix the DOM order |
| CL-07 | E | `<img>` without `alt` | `alt=""` or a description |
| CL-08 | W | `<img>` without size or aspect ratio | `width`/`height` |
| CL-09 | E | `onClick` on a div, span, li, etc. without a role | `<button>` or `<a href>` |
| CL-10 | E | Zoom disabled: the viewport meta, or a Next `viewport` export with `maximumScale: 1` / `userScalable: false` | Remove them |
| CL-11 | W | Transition on width, height, top, left, margin or padding | `transform`/`opacity` |
| CL-12 | W | `dangerouslySetInnerHTML` | Structured content, or sanitize and explain |
| CL-13 | W | Raw `z-20`+ | `z-(--layer-*)` |

For a deliberate exception, write `// design-lint-allow CL-xx <reason>` on the line or up to 3 lines above it. The reason is required by convention, and review checks that it holds.

## Visual regression (VR-01)

1. When the page looks right, run `npm run audit -- --baseline save`. This copies every screenshot (page × trend × theme × viewport) to `design/baseline/`.
2. After a change, run `npm run audit -- --baseline compare`. Any screenshot whose changed-pixel ratio passes the threshold becomes a VR-01 SHOULD, and a red-on-gray diff image goes to `design/audit/diff/`.

The default threshold is **0.0001 (0.01 % of pixels)**. Rendering noise measured on the template is about 0.001 %, while a 2 px radius change on one card is 0.03–0.10 %. A looser threshold such as 0.2 % misses real token changes. Set `audit.vrThreshold` or `--vr-threshold` only after measuring the noise of your own pages.

Baselines are only comparable on the **same OS, browser build and fonts**. Generate and commit them from the environment that compares them, usually CI. Don't commit baselines made on a laptop and compare them on Linux CI. The skill's own template ships no baseline.

Screenshots wait for `document.fonts.ready` and disable animations and the caret, so motion and font swap don't create false diffs.

## Before shipping

- `npm run build` passes. This includes `tokens --check` and `lint:design` with 0 E.
- `npm run audit -- --trends all` shows 0 MUST. Each remaining SHOULD is fixed or accepted with a reason in config.
- `VITE_SITE_URL` is the real origin, and the OG image and icons are the brand's own.
- After deploying, check PF-19 (compression) against the real URL with `npm run audit -- --url https://…`. Then check one share preview in a real chat app.
