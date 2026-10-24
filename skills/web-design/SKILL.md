---
name: web-design
description: Design and build "wow" web UIs as one Figma + React system. Stable human-factors principles (eyes, attention, hands, response time) plus swappable, dated trend packs, so a site can follow current design fashion with a data change instead of a rewrite. BRIEF → FOUNDATION (tokens + trend pack) → DESIGN (Figma via MCP, either direction) → BUILD (React + Tailwind v4 + Radix) → QA (human-factors audit, light/dark, contact sheet) → SYNC. Use for any request to design, build, restyle or review a website, landing page, web app screen or design system, to turn a Figma design into React or React into Figma, or to refresh a site to current trends.
---

# web-design

One design system, two surfaces:
- **Figma variables** and **CSS custom properties** share the same token names, built from `design/tokens.json` plus the active **trend pack**.
- Components read only semantic tokens. Restyling to a new trend is `trend.mjs apply <id>` in code and `figma-sync.mjs push` in Figma.
- The principles layer never moves; the trend layer moves every few months.

```
principles.md   (why people look, decide and tap; never changes for fashion)
      │ constrains
tokens.json     (brand: hue, type, scale)  +  trends/<id>  (fashion: shape, depth, texture, motion)
      │ build-tokens.mjs
      ├── src/design/tokens.css → Tailwind v4 utilities → React components and sections
      └── design/build/figma-variables.json → use_figma → Figma variables → Figma components
```

## Paths
- Skill: this directory (`SKILL_DIR`). Scripts are in `scripts/`, the template project is in `template/`, the trend library is in `trends/`.
- In a project made with `new-project.mjs`, the scripts and trends are vendored into `design/scripts` and `design/trends`. Run them as `npm run tokens|trend|audit|figma-sync`.

## Stack (default; respect an existing project's stack)
- Vite + React 19 + TypeScript
- Tailwind CSS v4: tokens through `@theme`, with dark mode and trends set by `data-theme` and `data-trend` attributes
- `class-variance-authority` for variants, `tailwind-merge` + `clsx` (`cn`)
- Radix primitives for every overlay and composite widget (dialog, menu, tabs, popover, tooltip, select)
- `motion` for layout and spring animation only; CSS transitions on tokens for everything else
- Playwright + axe-core for the audit

For an existing project, adopt the token contract (names in `references/tokens.md`) and the audit. Don't force the template.

## Workflow

### 1. BRIEF
Write `design/brief.md` before any pixels:
- **Audience and sector.** Who, which devices, and how expert they are.
- **The one job of the page or screen.** One primary action.
- **Content inventory.** The real copy, or the true shape of the data.
- **Brand constraints.** Fixed colors, fonts, logo.
- **Trust needs.** Proof, compliance, reassurance.
- **Language and market.** `lang`; for Korean, Japanese or Chinese, follow `references/korean.md` (line breaking, measure, forms, KWCAG, payment and address conventions).
- **Page type.** Marketing (`patterns.md`), product UI (`app-patterns.md`), or commerce and checkout (`conversion.md`).
- **Signature move.** The single "wow" element (hero treatment, type, motion or texture). Everything else stays calm.
- **Category leaders.** Name 3–5 to check prototypicality against (TR-02). Study their structure; never copy their assets or copy text.

Ask the user only for what you can't infer.

### 2. FOUNDATION
1. **New project:** `node scripts/new-project.mjs <dir> --install`. For an existing project, copy `template/design/` and the `@theme` contract into it.
2. **Set the brand** in `design/tokens.json`: `color.brand`, `color.accent-base`, `font.*`, and `radius.base` if the brand dictates it.
3. **Pick a trend.**
   - Run `trend.mjs list` and choose by `fits`/`avoid` and lifecycle stage, using `references/trends.md` § Choosing.
   - Then `trend.mjs apply <id>`.
   - If the user asks for something current that no pack covers, run the refresh procedure in `references/trends.md`.
4. **Check the tokens** with `trend.mjs check`. It must pass contrast and motion limits in light and dark.

### 3. DESIGN (Figma, when a Figma file is involved)
Follow `references/figma.md`. Load the Figma MCP skills first (`figma-use`, `figma-generate-library`, `figma-generate-design`, `figma-design-to-code`) and open a `create_session`.
- **Figma → code (Flow A):** run `get_design_context` and `get_variable_defs`, reconcile with `figma-sync pull`, then map components through Code Connect.
- **Code → Figma (Flow B):** run `figma-sync push` with `use_figma`, then build styles, then components with state variants, then Code Connect. Capture pages with `generate_figma_design` as references.
- **No Figma file** and the user wants one: create it (`figma-create-new-file`), then use Flow B.

### 4. BUILD (React)
- Compose pages from the catalogs: `references/patterns.md` (marketing sections), `references/app-patterns.md` (shells, tables, forms, feedback, overlays), `references/conversion.md` (pricing, product list and detail, cart, checkout, signup, and the dark-pattern rules that are law in Korea and the EU). Each gives anatomy, measurements, the "why", and when not to use it.
- Write real copy with `references/content.md` (English and Korean microcopy rules). Never leave lorem ipsum in a review.
- Motion follows `references/motion.md`: per-component enter and exit specs, springs, modern CSS recipes, reduced-motion substitutes and performance budgets.
- Use and extend `src/components/ui/*`:
  - **Variants:** `variant` (solid/soft/outline/ghost/link) × `tone` (brand/neutral/danger, …) × `size`.
  - Emit `data-slot`, `data-variant` and `data-tone` on the root element.
  - Never hard-code palette colors (`bg-blue-600`), raw hex, or px outside the scale.
- Before writing a section, check:
  - one focal point and one solid CTA per viewport (LA-01, LA-04)
  - 44 px touch targets (MO-02)
  - 16 px+ body text at 45–75 characters per line (TY-01, TY-02)
  - visible labels (CO-05)
  - every interactive state present (RE-01)
  - motion from the tokens, with reduced-motion handled (MT-01 to MT-03)
- The **signature move** gets the craft budget: custom visual, considered motion, art-directed type. Use the `trend-<id>:` variants or `pack.css` only for what tokens can't express.

### 5. QA
1. `npm run build`. Generated tokens must be fresh (`tokens --check` is part of the build).
2. `node scripts/audit.mjs --trends active` (or `all` after touching the tokens). Pages come from `audit.pages` in the config (the template audits `/` and `/#/app`). Fix every **MUST**. Fix each **SHOULD** or write down why it is acceptable. `trend.mjs check` also prints APCA advisories; fix them for body and muted text.
3. **Look at the result.** Open `design/audit/contact-sheet.html` and read the screenshots for mobile, tablet and desktop in light and dark. Judge them against the brief:
   - Does a 5-second look reveal what this is and what to do next (TR-01)?
   - Is there exactly one focal point above the fold?
   - Does the signature move land, without competing with the CTA?
   - Is spacing rhythmic: groups twice as far apart as their items (LA-02)?
   - Is dark mode designed, not inverted?
4. Score the work with `references/review.md` (8 criteria, 0–10; ship at ≥7, award-level at ≥8; R6 = 0 blocks shipping). Report the scores and the top 3 fixes.
5. For Figma work, compare the `get_screenshot` result with the audit screenshot at the same viewport.

### 6. SYNC and HANDOFF
- Tokens changed in code: `figma-sync push`. Changed in Figma: `figma-sync pull --write`, then `tokens`.
- Production: `trend.mjs apply <id> --lock`, which ships only the active pack.
- Report back with:
  - what was built
  - the chosen trend and why (fits, stage)
  - audit results (MUST/SHOULD counts) and any accepted SHOULDs
  - screenshots
  - Figma links

## Rules that override taste
1. MUST rules in `references/principles.md` beat every trend, brand request and Figma frame. If a design breaks one, build the compliant version and say so.
2. One trend pack per product. One signature move per page. Novelty sits on top of conventional structure (prototypicality), never instead of it.
3. Never copy code, markup, copy text or assets from paid UI kits or from any studied site. Learn structure and measurements; write your own. MIT-licensed sources (for example shadcn/ui and Radix) may be adapted with attribution. If the user owns a paid kit license, its code may be used in *their* product from their local copy, but never committed to this skill or any public repo.
4. A trend pack's `stage` and `reviewBy` must be true. If a pack is STALE, refresh it before recommending it.

## References
- `references/principles.md`: human factors (eyes → understanding → decision → hands → feedback → trust) and rule IDs
- `references/patterns.md`: marketing sections and the component inventory
- `references/app-patterns.md`: product UI (navigation, tables, forms, feedback, empty states, search, settings, dashboards, overlays)
- `references/conversion.md`: landing and pricing evidence, commerce blueprints, signup, and dark-pattern law
- `references/visual-craft.md`: OKLCH color ramps, dark mode, type craft, layout, layered shadows
- `references/motion.md`: choreography, per-component motion, modern CSS support and recipes, performance, reduced motion
- `references/content.md`: microcopy rules (English and Korean)
- `references/korean.md`: Korean-first and CJK typography, forms, KWCAG, local conventions
- `references/review.md`: the design review scorecard and procedure
- `references/trends.md`: how trend packs work, choosing one, and the quarterly refresh procedure (`trend.mjs radar`)
- `references/tokens.md`: token contract, naming, modes, and how to add tokens
- `references/figma.md`: the two-way Figma workflow, naming contract, and Figma QA
