# Changelog

## [0.3.0] - 2026-10-25

### Added
- **References:**
  - `design-process.md`: core designer skills ranked by how consistently education and career frameworks cite them; the process loop; FRAME/CONTENT/EXPLORE/FIDELITY/HIER/STATE/EVAL/CRIT/HANDOFF rules; critique procedure; definition of done.
  - `figma-authoring.md`: 2025–26 platform changes; file and page structure; layout, component, variable and handoff rules; lint rules L01–L30.
  - `illustration.md`: roles and sizes, a token-driven style family, theming and dark mode, accessibility, production budgets, anti-patterns, IL-01 to IL-22.
- **Figma scripts:**
  - `figma-library.mjs`: generates a starter Figma library in 8 idempotent steps (pages, text and effect styles, Button with 24 bound variants, Badge, Field, Card, foundations sheet, Light/Dark review frames). Verified against a live file.
  - `figma-lint.mjs`: a read-only page linter (unbound values, missing auto layout, default names, detached instances, variant consistency, text size, touch targets, contrast, variable hygiene, Ready status) plus a report formatter that exits non-zero on E findings.
- **Template:**
  - Illustration kit (`src/illustrations`): 8 object-based spot illustrations with no hex colors, theming through `color.illus-*` and `illus.*`, and per-pack character (stroke, caps, radius, shadow).
  - Living style guide `#/system`: overview, principles, get started, foundations with live AA/AAA contrast badges, components, patterns, Do/Don't cards, changelog, and a trend/theme switcher in the header.
  - `useAppearance` store kept in sync through `<html>` attributes.
- **Tokens:** `space.*` (also bound in Figma), `illus.*`, `color.illus-*`.
- **Audit:**
  - `audit.accept` for documented SHOULD exceptions.
  - `data-audit-specimen` excludes intentional examples from page budgets.
  - `/#/system` is audited by default.

### Changed
- `layout.prose` changed from 34em to 30em: Inter is narrow, and 34em measured about 85 characters per line.
- Empty states in the app demo now use illustrations, and the Do/Don't captions are 16 px.

## [0.2.0] - 2026-10-24

### Added
- References:
  - `app-patterns.md`: product UI, 9 areas, about 50 rules, with the choices made where design systems disagree.
  - `conversion.md`: CV, EC, ON and DP rules with evidence levels, plus page blueprints. Covers Korea's 2025 dark-pattern law and the EU and US rules.
  - `visual-craft.md`: OKLCH 12-step ramp recipe, accessible brand fills, dark-mode rules, type craft, layered shadows.
  - `motion.md`: choreography rules, per-component motion specs, springs, modern CSS support as of 2026-10, performance budgets, reduced-motion substitutes.
  - `content.md`: English and Korean microcopy rules.
  - `korean.md`: Hangul metrics, line breaking, a 30–45 character measure, forms and flows, KWCAG 2.2.
  - `review.md`: an 8-criterion design scorecard with ship and award gates.
- Template:
  - App demo page (`#/app`).
  - New components: Dialog/Drawer, Tabs, Tooltip, DropdownMenu, Toast (with undo), Skeleton (delayed), EmptyState, CommandPalette (⌘K), DataTable (sort, bulk actions, density).
  - Korean format helpers (`lib/format-ko.ts`).
- Tokens: `layer.*` stacking order; `layout.prose-ko`.
- Trend pack `civic-clear`, an evergreen public-service style.
- `trend.mjs radar`: packs due for review, plus Baseline changes for tracked platform features (`trends/radar.json`).
- `trend.mjs check`: APCA advisory for body and muted text.
- `audit.mjs`:
  - multi-page runs (`--pages`, `audit.pages` in config)
  - new rules TY-04 (text-spacing override), TY-05 (zoom blocked) and CG-07 (vague labels)
  - sticky bottom CTAs count for LA-04 and MO-05
  - label hit areas count toward target size
  - loaders are exempt from MT-05
  - a Hangul measure limit of 45
- `new-project.mjs --lang ko`.
- The app demo loads as its own chunk, so the landing page doesn't load its code.
- Browser end-to-end tests for the app demo cover selection, undo scope, palette focus return, Korean line breaking and toast timers. They run in CI after the build.

### Changed
- `:lang(ko)` base CSS: `word-break: keep-all`, `overflow-wrap: break-word`, the Hangul measure, and no faux italics in CJK.
- Dark-mode muted text is lighter in 5 packs (APCA advisory). Projects that copied a pack keep their old values until they re-add the pack.
- Tooltip open delay changed from 400 to 300 ms. Toasts with an action now stay 10 s.
- Dialog widths are 400/600/800. The compact table row is 32 px with a mouse; on touch, rows stay at least 44 px so the checkbox targets stay large enough.

## [0.1.0] - 2026-10-24

### Added
- `web-design` skill: workflow (BRIEF → FOUNDATION → DESIGN → BUILD → QA → SYNC) and five references (principles, patterns, trends, tokens, figma).
- Token pipeline: a DTCG source builds Tailwind v4 `@theme`, light/dark and trend overrides, Figma variables (COLOR, FLOAT, STRING, TIMING, EASING) and resolved values.
- Trend packs, reviewed 2026-10: `quiet-editorial`, `signal-dark`, `frosted`, `kinetic-studio`, `loud`, `warm-natural`.
- `trend.mjs`: list, apply (with `--lock`), add, new and check. Check covers contrast in both modes, motion limits and freshness.
- `figma-sync.mjs`: push (upsert by name, with code syntax), pull-script and pull (diff, `--write`), plus `--only` group filters.
- `audit.mjs`: Playwright and axe audit of target size, type, measure, CTA hierarchy, reflow, motion, reduced motion and focus, plus a contact sheet.
- React template: Button, Card, Badge, Field, SectionHeading, Reveal, and sections (nav, hero, logos, bento, stats, testimonial, pricing, FAQ, CTA, footer), with a dev trend switcher.
- `new-project.mjs`: self-contained scaffolds with vendored scripts and packs.
- Tests (23): color math, token overlay and resolution, pack checks, the Figma push→pull round trip, a browser cascade test for subtree trend/theme previews, and `trend apply` include handling. CI runs on Node 22 and 24, followed by the full audit.
