# Trends: the fast layer

Fashion changes every few months. People's eyes and hands don't. The skill keeps the two apart:

| Layer | Changes | Lives in | Who may change it |
|---|---|---|---|
| Principles | almost never | `references/principles.md` | evidence only |
| Base tokens | per brand | `design/tokens.json` | brand decisions |
| **Trend pack** | **every 3–6 months** | `trends/<id>/pack.json` + `pack.css` | this procedure |
| Components and sections | per product | `src/components`, `src/sections` | product work |

Components read only semantic tokens (`bg-primary`, `rounded-card`, `surface`, `duration-(--motion-duration-small)`). So **a trend switch is a data change, not a code change**: `trend.mjs apply <id>` restyles every page, the Figma variables follow with `figma-sync push`, and the audit re-checks the result.

## Anatomy of a pack

```
trends/<id>/
  pack.json   metadata + token overrides (+ fonts)
  pack.css    optional structural CSS, every rule scoped under [data-trend="<id>"]
```

```jsonc
{
  "id": "frosted",
  "name": "Frosted",
  "summary": "Translucent layered surfaces with soft refraction and springy motion",
  "stage": "peak",            // emerging | rising | peak | declining | fading
  "reviewed": "2026-10",      // when the stage was last verified
  "reviewBy": "2027-04",      // after this date `trend.mjs list` marks it STALE
  "fits": ["consumer apps", "creative tools"],
  "avoid": ["dense data tables", "low-end devices"],
  "why": "Depth cues separate layers preattentively; translucency keeps context visible behind overlays.",
  "risks": ["Text contrast over busy backdrops: keep chrome tint ≥ 0.6 alpha"],
  "fonts": [{ "family": "…", "href": "…" }],
  "tokens": { "color": { "chrome": { "$value": "oklch(0.98 0.01 260 / 0.66)" } }, "effect": { "chrome-blur": { "$value": "20px" } } }
}
```

Token overrides use the same DTCG shape as `tokens.json`.
- If a value sets no dark value, it is used in both modes. Set `$extensions.mode.dark` for colors that need a dark counterpart.
- Write `"dark": "inherit"` to keep the base dark value.

### What a pack may touch
These are the levers a trend has. Keep a pack to the levers that define it.

| Lever | Tokens |
|---|---|
| Hue and palette mood | `color.brand`, `color.accent-base`, `color.bg`, `color.surface*`, `color.fg*`, `color.border*` |
| Shape | `radius.base` (control, card and panel derive from it), `radius.pill` |
| Type voice | `font.sans`, `font.display`, `font-weight.display`, `tracking.display`, `text.display`, `effect.display-transform` |
| Depth | `shadow.card`, `shadow.raised`, `shadow.overlay`, `effect.border-width` |
| Translucency (chrome only: nav, toolbars, sheets; content surfaces stay opaque) | `color.chrome`, `effect.chrome-blur`, `effect.chrome-saturate` |
| Texture and atmosphere | `effect.hero-bg` (gradients), `effect.grain-opacity` |
| Motion character | `ease.*`, `motion.duration.*` (≤500 ms), `motion.distance.reveal`, `effect.card-hover-lift` |
| Rhythm | `layout.section-y`, `layout.container` |

`pack.css` is for things tokens can't express, such as a hard offset shadow on hover, a glass highlight or a gradient text fill. Scope every rule under `[data-trend="<id>"]`. Guard expensive effects with `@supports` and motion with `prefers-reduced-motion`. Components can also use the generated `trend-<id>:` variant for small structural tweaks. Prefer tokens.

### Non-negotiables (enforced)
`trend.mjs check` fails a pack if:
- in either mode, text contrast drops below 4.5:1 or boundary or ring contrast drops below 3:1 (measured after compositing translucent surfaces over `color.bg`)
- any `motion.duration.*` exceeds 500 ms
- `pack.css` uses infinite animation without a reduced-motion fallback

`audit.mjs --trends <id>` re-runs every page rule under the pack.

## Choosing a pack for a project

1. Run `trend.mjs list`. Skip packs marked **STALE** or in the `fading` stage. `declining` is acceptable only when the audience is conservative.
2. Match `fits` and `avoid` against the brief: audience, sector, density, device mix and brand age.
3. Trends signal different things:
   - consumer and creative: expressive packs
   - finance, health and government: restrained packs, where trust beats novelty (TR-02)
   - dev tools: dark, precise and mono accents
4. **Wow budget.** Wow comes from one memorable move plus perfect basics, not from stacking trends. Pick one pack. In the brief, name the single signature element (hero treatment, type, motion or texture) and keep everything else calm.
5. Run `trend.mjs apply <id>`, then audit, then look at the contact sheet in light and dark.

## Refreshing trends (run quarterly, or when asked "what's trending")

The goal is to update `stage`, `reviewed` and `reviewBy` from current evidence, add new packs and retire old ones. Never write a pack from intuition.

1. **Collect signals.** Use at least three independent signal types and record them privately, outside this repo:
   - award galleries (site of the day/year)
   - curated galleries of real production sites
   - platform design-language changes (OS and design-system releases)
   - new browser capabilities reaching baseline support
   - shipped redesigns of category leaders
   - design-tool releases
2. **Count, don't guess.** A trend is:
   - `rising` when it appears in multiple independent sources and is growing
   - `peak` when it is common in award galleries and starting in mainstream products
   - `declining` when leaders are moving away
   - `fading` when it reads as dated
   Keep counts and dates in the private notes.
3. **Extract mechanics.** For each trend, measure real examples: radii, blur amounts, type sizes and weights, tracking, color lightness and chroma ranges, motion durations and easing. Write the values as token overrides, never as copied CSS from a site.
4. **Explain the why.** Name the perceptual mechanism that makes it work and the way it can hurt usability. If you can't name the mechanism, it's decoration. Treat it as an optional signature element, not a pack.
5. **Scaffold.** Run `trend.mjs new <id> [--from <closest pack>]`, fill in the TODOs, then run `trend.mjs check <id>` and `audit.mjs --trends <id>`.
6. **Retire.** Lower the stage of packs that are fading. Don't delete them; existing projects may depend on them.
7. **Changelog.** Every stage change and every new pack goes in `CHANGELOG.md`.

## Shipping
- `trend.mjs apply <id> --lock` ships only the active pack's CSS.
- The default build includes all packs, so the dev switcher and `?trend=` previews work.
- Production builds should lock.
