# web-design skill

**[한국어](README.ko.md)**

A Claude Code skill that designs and builds web UIs as **one Figma + React system**. It is built on two layers:

- **Principles that don't change.** How people see, decide and act on a screen: attention, scanning, Fitts's law, touch reach, response times, motion perception and accessibility. They are written as about 75 testable rules.
- **Trends that change every few months.** Dated, swappable **trend packs**. Moving a product to the current look is a data change, `trend apply <id>`, and not a rewrite. Figma follows with the same command.

![Seven looks, one codebase: base and six trend packs (light)](docs/trends-light.jpg)

The page above is the same React code in all seven panels. Only the active trend pack differs. Every panel passes the same human-factors audit (0 MUST, 0 SHOULD findings) in light and dark mode, at 320, 375, 768 and 1440 px.

## What's inside

```
skills/web-design/
  SKILL.md                 workflow: BRIEF → FOUNDATION → DESIGN (Figma) → BUILD (React) → QA → SYNC
  references/
    principles.md          eyes → understanding → decision → hands → feedback → trust, plus rule IDs
    patterns.md            sections and components with measurements, the why, and when not to use them
    trends.md              how trend packs work, how to choose one, and the quarterly refresh procedure
    tokens.md              token contract (DTCG → CSS variables → Tailwind v4 → Figma variables)
    figma.md               two-way Figma workflow through the official Figma MCP server
  trends/<id>/             pack.json (metadata + token overrides) + pack.css (signature details)
  scripts/
    build-tokens.mjs       tokens + packs → tokens.css, fonts.css, figma-variables.json
    trend.mjs              list | apply | add | new | check (contrast and motion limits in both modes)
    figma-sync.mjs         push (code → Figma variables) | pull-script | pull (Figma → code diff/--write)
    audit.mjs              Playwright + axe human-factors audit, plus a contact sheet per trend × theme × viewport
    new-project.mjs        scaffold a self-contained project from the template
  template/                Vite + React 19 + TypeScript + Tailwind v4 + Radix + cva + motion
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

Each pack records its lifecycle `stage` and a `reviewBy` date. `trend list` marks a pack **STALE** once the date passes, so packs get re-checked against current evidence instead of quietly aging. `references/trends.md` has the refresh procedure.

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
node skills/web-design/scripts/new-project.mjs ../my-site --install --trend signal-dark
cd ../my-site
npm run dev                          # dev panel (bottom-right) switches trend and theme live
npm run trend -- list
npm run trend -- apply warm-natural  # restyle everything
npm run audit -- --trends all        # human-factors audit + contact sheet in design/audit/
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
