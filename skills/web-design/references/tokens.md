# Token contract

## Files
| File | Role | Edit? |
|---|---|---|
| `design/tokens.json` | Base tokens in DTCG format (`$value`, `$type`, `$description`, `$extensions.mode.dark`) | yes |
| `design/trends/<id>/pack.json` | Trend overrides (same shape) plus metadata | yes |
| `design/web-design.config.json` | `trend` (active id or `none`), `include` (`all`, `active` or a list), `fonts` (base font CSS URLs) | through `trend.mjs apply` |
| `src/design/tokens.css` | Generated: `@theme` plus `[data-theme]` / `[data-trend]` overrides plus `trend-<id>:` variants | no |
| `src/design/fonts.css`, `src/design/trends.json` | Generated | no |
| `design/build/figma-variables.json`, `tokens.resolved.json` | Generated: Figma payload and resolved values per trend and mode | no |

Run `build-tokens.mjs` after every token edit. `build-tokens.mjs --check` fails when generated files are stale; the template's `npm run build` runs it.

## Naming
A path maps directly to a CSS variable: `color.fg-muted` becomes `--color-fg-muted`. These top-level groups are Tailwind v4 theme namespaces and generate utilities:

- `color`: `bg-*`, `text-*`, `border-*`, `ring-*`, …
- `font`: `font-sans`, `font-display`, `font-mono`
- `font-weight`, `text` (with `--line-height` sub-keys), `tracking`, `leading`
- `radius`: `rounded-control`, `rounded-card`, `rounded-panel`, `rounded-pill`
- `shadow`: `shadow-card`, `shadow-raised`, `shadow-overlay`
- `ease`: `ease-out`, `ease-in`, `ease-standard`

Other groups become plain custom properties, used with Tailwind's `(--var)` shorthand:

- `motion.duration.*`: `duration-(--motion-duration-small)`
- `size.*`: `h-(--size-control-md)`, `min-h-(--size-touch-min)`
- `layout.*`: `container-page`, `section-y` and `prose-measure` utilities, `h-(--layout-nav-h)`
- `effect.*`: read by the `surface` utility, the hero background, the grain overlay and display text

`--color-*: initial` removes Tailwind's default palette, so `bg-blue-600` does not compile. Use semantic names.

## Semantic color set
| Token | Use | Contrast rule |
|---|---|---|
| `bg` | page background | |
| `surface`, `surface-raised`, `surface-sunken` | cards, popovers, wells (always opaque) | |
| `chrome` | nav bars, toolbars, sheets (the only translucent layer, behind `effect.chrome-blur`) | `fg`, `fg-muted` ≥4.5 composited over `bg` |
| `fg` | primary text | ≥4.5 on `bg` and `surface` |
| `fg-muted` | secondary text | ≥4.5 on `bg` and `surface` |
| `fg-subtle` | decorative and meta only, never content | (axe catches misuse) |
| `border` | dividers, card edges (decorative) | |
| `border-strong` | input borders, boundaries users must see | ≥3 on `bg` |
| `primary`, `primary-hover`, `primary-fg` | the one primary action | `primary-fg` ≥4.5 on `primary` |
| `primary-soft`, `primary-soft-fg` | tinted backgrounds, selected states | |
| `primary-text` | brand-colored text and icons on `bg`/`surface` (eyebrows, links, ghost buttons) | ≥4.5 on `bg` and `surface` |
| `accent`, `accent-fg` | secondary highlight; one accent hue max (LA-06) | ≥4.5 |
| `ring` | focus outline | ≥3 on `bg` |
| `success`, `warning`, `danger` (+ `-fg`) | status | |
| `overlay` | modal scrim | |

`primary-hover` and `primary-soft` are derived from `brand` with relative color syntax (`oklch(from {color.brand} …)`), so a trend that changes only `color.brand` gets consistent hover and soft states for free.

## Modes
- Dark values live in `$extensions.mode.dark`. `index.html` sets `data-theme` before paint (from `localStorage['wd-theme']` or the OS).
- Derived tokens are re-declared on every `[data-theme]` / `[data-trend]` element. That lets a subtree preview another trend or theme: wrap it in `<div data-trend="x" data-theme="dark">`.

## Adding a token
1. Add it to `tokens.json` under the right group with `$type` and `$description`.
2. Use it in components through the utility or the `(--var)` shorthand.
3. If it's a color pair, add it to `CONTRAST_PAIRS` in `scripts/trend.mjs`.
4. Run `build-tokens.mjs`, then `trend.mjs check`, then `figma-sync push` if a Figma file exists.

Supported `$type` values are `color`, `dimension`, `fontFamily`, `fontWeight`, `number`, `duration`, `cubicBezier`, `shadow` and `string`. Figma receives COLOR, FLOAT, STRING, TIMING and EASING variables. Shadows become effect styles and gradients become paint styles (see `figma.md`).
