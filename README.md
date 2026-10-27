# web-design skill

**[한국어](README.ko.md)**

A Claude Code skill that designs and builds web UIs as **one Figma + React system**. It is built on two layers:

- **Principles that don't change.** How people see, decide and act on a screen: attention, scanning, Fitts's law, touch reach, response times, motion perception and accessibility. They are written as about 70 rules with IDs. About 20 of them are checked automatically, and the rest are review checklist items.
- **Trends that change every few months.** Dated, swappable **trend packs**. Moving a product to the current look is a data change, `trend apply <id>`, and not a rewrite. Figma follows with the same command.

![Eight looks, one codebase: the base and seven trend packs, light mode](docs/trends-light.jpg)

All eight panels run the same React code. Only the active trend pack changes. Every panel passes the same human-factors audit in light and dark mode, at 320, 375, 768 and 1440 px, with 0 MUST findings. Each page also gets a performance pass on a slow phone and an SEO pass, run once with the default trend.

<details>
<summary>The same eight looks in dark mode</summary>

![The base and seven trend packs, dark mode](docs/trends-dark.jpg)

</details>

The template has three pages, and the audit checks each one on every trend:

- **`/`, the marketing page:** hero, logos, bento grid, stats, testimonial, pricing, FAQ and CTA.
- **`#/app`, the product UI:** a sidebar shell, a ⌘K command palette, a data table with sorting, bulk actions and undo, plus dialogs, menus, tooltips, toasts, skeletons and empty states.
- **`#/system`, a living style guide:** foundations with live contrast badges, components, Do/Don't cards, and illustrations drawn from tokens.

![The product UI in the base trend (light) and signal-dark (dark)](docs/app.jpg)

![The living style guide in the base trend and in warm-natural](docs/system.jpg)

![Token-driven illustrations: one source, re-themed by every trend in light and dark](docs/illustrations.jpg)

## Vite or Next.js

`new-project.mjs` creates either kind of project. Both share the same components, sections and screens in `src/`.

| | Vite (default) | Next.js 16 (`--framework next`) |
|---|---|---|
| Routing | hash routes (`#/app`), so any static host works | real paths (`/app`), with metadata per route |
| First paint | rendered in the browser | every route prerendered to HTML |
| LCP on slow 4G | 2.1–2.6 s | 1.6 s |
| First-load JS | 101–143 KB | 170–211 KB |
| Fonts | stylesheets linked from the head; each trend's fonts load on demand | Google Fonts through `next/font`, self-hosted with metric-matched fallbacks; other fonts (such as Pretendard) linked from their CDN |
| Deploy | `dist/` on any static host | `next start`, a container, or a static export (`npm run build:static`) |

Choose Next.js when pages need to rank on their own or load faster. Choose Vite when first-load JS on low-end phones matters most.

## Quality gates

Each gate runs at the time shown below. `references/web-quality.md` documents the rules.

| Gate | What it checks | When |
|---|---|---|
| `code-lint.mjs` (CL-01–13) | raw colors, default palette classes, arbitrary px, removed focus outlines, actions on pointer down, clickable `div`s, missing `alt` or image size, disabled zoom | `npm run build` |
| `trend check` | text contrast of 4.5:1 and boundary contrast of 3:1 in both modes, motion limits, pack schema and freshness | CI |
| `audit.mjs`, human factors | about 20 automated rules from `principles.md` (targets, measure, focus, contrast, layout, motion) plus axe, on each theme × viewport for the active trend; every trend with `--trends all` (CI) | `npm run audit` |
| `audit.mjs`, performance (PF) | once per page, default trend, on a mobile profile over slow 4G with the CPU slowed 4×: LCP, CLS, TBT, byte budgets, images, fonts, blocking scripts | `npm run audit` |
| `audit.mjs`, SEO and sharing (SE) | once per HTML document, with and without JS: title, description, canonical, Open Graph, favicons, JSON-LD, robots and sitemap, crawlable links | `npm run audit` |
| Visual regression (VR-01) | pixel diffs against saved baselines | `--baseline save` / `compare` |
| Component tests | keyboard and focus behavior and axe, in a real browser (Vitest browser mode) | `npm test` |

## What's inside

```
skills/web-design/
  SKILL.md                 workflow: BRIEF → FOUNDATION → DESIGN (Figma) → BUILD (React) → QA → SYNC
  references/
    principles.md          eyes → understanding → decision → hands → feedback → trust, plus rule IDs
    patterns.md            marketing sections and the component inventory
    app-patterns.md        product UI: navigation, tables, forms, feedback, search, settings, dashboards, overlays
    conversion.md          landing/pricing evidence, commerce blueprints, signup, dark-pattern law (KR/EU/US)
    visual-craft.md        OKLCH ramps, dark mode, type craft, layout, layered shadows
    motion.md              choreography, per-component motion, modern CSS support, budgets, reduced motion
    content.md             microcopy rules in English and Korean
    korean.md              Korean-first / CJK typography, forms, KWCAG 2.2, local conventions
    review.md              design review scorecard (0–10) and procedure
    design-process.md      how strong designers work: framing, exploration, critique, definition of done
    figma-authoring.md     Figma file structure, auto layout, components, variables, handoff, lint rules
    illustration.md        illustration roles, a token-driven style family, theming, a11y, IL checklist
    trends.md              how trend packs work, how to choose one, the quarterly refresh procedure
    tokens.md              token contract (DTCG → CSS variables → Tailwind v4 → Figma variables)
    figma.md               two-way Figma workflow through the official Figma MCP server, Code Connect
    web-quality.md         perf budgets (PF), SEO and share (SE), code lint (CL), visual regression (VR)
  trends/<id>/             pack.json (metadata + token overrides) + pack.css (signature details)
  scripts/
    build-tokens.mjs       tokens + packs → tokens.css, fonts.json (+ next/font fonts.ts), figma-variables.json
    trend.mjs              list | apply | add | new | check | radar (contrast, APCA advisory, motion, freshness)
    figma-sync.mjs         push (code → Figma variables) | pull-script | pull (Figma → code diff/--write)
    figma-library.mjs      generate a starter Figma library step by step (pages, styles, components, review)
    figma-lint.mjs         lint a Figma page against the authoring rules (L01–L30)
    audit.mjs              human-factors audit (Playwright + axe), slow-4G perf pass, SEO/share pass, visual regression
    code-lint.mjs          static design-discipline lint (CL-01 to CL-13), part of the build
    seo-files.mjs          robots.txt + sitemap.xml from the site origin (Next projects)
    new-project.mjs        scaffold a self-contained Vite or Next.js project
  template/                Vite + React 19 + TypeScript + Tailwind v4 + Radix + cva + motion; Vitest browser tests; Code Connect
  template-next/           Next.js 16 App Router overlay: same src/, real routes, next/font, metadata, sitemap, robots
```

## Trend packs (reviewed 2026-10)

| Pack | Stage | Fits | Signature |
|---|---|---|---|
| `quiet-editorial` | rising | studios, luxury, research, long-form | oversized serif display with an italic last word, flat cards, pill controls |
| `signal-dark` | rising | dev tools, AI products, data infrastructure | dark-first, fading hairline grid, mono labels, glow on the primary action |
| `frosted` | peak | consumer apps, media, mobile-first | floating glass nav capsule; content cards stay opaque |
| `kinetic-studio` | peak | launches, agencies, portfolios | poster-scale grotesk that rises word by word (once, ≤500 ms, off under reduced motion) |
| `loud` | rising | youth consumer, F&B, drops, creators | hard outlines, offset shadows, press-down buttons, pop-colored tiles |
| `warm-natural` | rising | wellness, hospitality, home, nonprofits | soft optical serif, warm paper, rounded shapes, gentle motion, grain |
| `civic-clear` | peak (evergreen) | public services, finance, health, Korean-first services | 17 px body, 48 px controls, modest corners, high contrast, one blue action |

Each pack records its lifecycle `stage` and a `reviewBy` date. `trend list` marks a pack **STALE** once the date passes, so packs get re-checked against current evidence instead of quietly aging. `trend radar` lists packs that are due and the browser features whose Baseline status changed since the last review. `references/trends.md` has the refresh procedure.

## Install

```bash
git clone https://github.com/jeonghun-app/web-design-skill.git
cd web-design-skill
./install.sh                      # symlinks skills/web-design into ~/.claude/skills
cd skills/web-design/template && npm install && npx playwright install chromium
```

Runs on macOS and Linux with Node 22 or 24. On Windows, use WSL: the audit starts its preview server through `npx` and stops it as a POSIX process group.

For Figma work, add the official Figma MCP server to Claude Code and authenticate it with `/mcp`.

## Use

Ask Claude Code things like:

- "Build a landing page for our scheduling app, in a current look"
- "Implement this Figma frame in React: <figma link with node-id>"
- "Push our tokens into a new Figma file and build the component library"
- "Our site looks dated: move it to a current trend and show me light/dark screenshots"
- "What's trending in web design now? Refresh the trend packs"

Or run the tools directly:

```bash
node skills/web-design/scripts/new-project.mjs ../my-site --install --trend signal-dark   # add --lang ko for Korean
# or: ... ../my-site --framework next --site-url https://my-site.com --install
cd ../my-site
npm run dev                          # dev panel (bottom-right) switches trend and theme live
npm run trend -- list
npm run trend -- apply warm-natural  # restyle everything
npm run audit -- --trends all        # human-factors + perf + SEO audit, contact sheet in design/audit/
npm test                             # component tests (keyboard, focus, axe) in a real browser
npm run figma-sync -- push > design/build/figma-push.js   # run with the use_figma MCP tool
```

## How a trend switch works

1. Components read only semantic tokens: `bg-primary`, `rounded-card`, `text-display`, `surface`, `duration-(--motion-duration-small)`. Tailwind's default palette is removed, so hard-coded colors don't compile.
2. A pack overrides some tokens under `[data-trend="<id>"]`, in light and dark. Derived tokens such as the hover and soft brand states are computed with relative color syntax, so changing one brand hue is enough.
3. Anything tokens can't express goes in a small, scoped `pack.css`. Components expose `data-slot`, `data-variant` and `data-tone` hooks for it.
4. `trend check` fails a pack if text contrast drops below 4.5:1 or a boundary below 3:1, in either mode, after compositing translucent layers. It also fails when a duration exceeds 500 ms or a loop has no reduced-motion fallback.
5. In Figma, the same variable names, such as `color/primary` with `codeSyntax var(--color-primary)`, are overwritten in place. Every bound layer restyles at once.

## License

MIT. The template adapts patterns from MIT-licensed projects (shadcn/ui, Radix). No code, markup, copy or assets from paid UI kits or from any studied website are included.
