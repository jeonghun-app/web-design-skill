# web-design skill

**[한국어](README.ko.md)**

A Claude Code skill that designs and builds web UIs as **one Figma + React system**. It is built on two layers:

- **Principles that don't change.** How people see, decide and act on a screen: attention, scanning, Fitts's law, touch reach, response times, motion perception and accessibility. They are written as about 75 testable rules.
- **Trends that change every few months.** Dated, swappable **trend packs**. Moving a product to the current look is a data change, `trend apply <id>`, and not a rewrite. Figma follows with the same command.

![Seven looks, one codebase: base and six trend packs (light)](docs/trends-light.jpg)

The page above is the same React code in all seven panels. Only the active trend pack differs. Every panel passes the same human-factors audit (0 MUST, 0 SHOULD findings) in light and dark mode, at 320, 375, 768 and 1440 px. The template also has a product-UI page (`#/app`) and a **living style guide** (`#/system`), and the audit checks both on every trend.
- `#/app` has a sidebar shell, a ⌘K palette, a data table with bulk actions and undo, dialogs, menus, toasts, skeletons and empty states.
- `#/system` covers foundations with live contrast badges, components, Do/Don't cards, and token-driven illustrations that re-theme with every trend.

![Token-driven illustrations: one source, re-themed by every trend and dark mode](docs/illustrations.jpg)

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
