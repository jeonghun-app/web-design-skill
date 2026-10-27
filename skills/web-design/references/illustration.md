# Illustration: when it helps, how to keep it consistent, how it themes

Decorative imagery is mostly ignored: eye-tracking shows attention going to text and to images that *carry information*. Product illustration earns its place by explaining a state, a concept or a next step. This file is about how to make it do that, in one consistent style that re-themes with every trend pack and in dark mode.

The template ships a token-driven kit, `src/illustrations`:
- 8 object-based spot illustrations: empty inbox, no results, success, error, upload, secure, analytics, getting started
- an `<Illustration name size label?>` wrapper

## 1. Roles and sizes

| Role | Size | Density | Helps when | Harms when |
|---|---|---|---|---|
| Spot | 48–120 (72 standard) | ≤1 per card | It explains a technical idea or draws the eye on a busy page | The same spot repeats on every row |
| Empty state | 120–144 in a card; up to 240 page-level | 1 | First use: shows what goes here, next to the CTA | It's shown while loading; on **no-results** states (keep those text-first, IL-21); it pushes the CTA below the fold |
| Onboarding | 160–320 per step | 1 per step | It frames the task, or shows a simplified UI instead of a screenshot | It's a decorative carousel |
| Error / 404 | 200–320 | 1 | It softens a dead end | It jokes about data loss or 500 errors |
| Success | 72–160 | transient | A real milestone | It celebrates trivial actions or blocks input |
| Feature explainer | 240–480 | 1 per block | It shows a process or a relationship | The metaphor itself needs explaining |
| Hero / marketing | ≤50% of the hero width | 1 per page | It sets brand mood when the product can't be shown | It's a generic flat-people scene, or it delays LCP |
| Ambient pattern | background | outside content areas | It adds brand texture | It sits behind text |

**Before adding any illustration, ask: would an icon, a sentence, or nothing work better? (IL-01)**

## 2. One style family

Consistency comes from fixing a small set of parameters for the whole product. Here they are tokens, so a trend pack changes them all at once.

| Parameter | Token | Base value | Rule |
|---|---|---|---|
| Stroke width | `illus.stroke` | 2 (dark mode 1.75) in a 144 viewBox | One weight, at most two. Renders at 1.5–4 px. |
| Line cap / join | `illus.cap`, `illus.join` | round / round | One choice per system (round+round or square+miter) |
| Corner radius | `illus.radius` | 6 | Same radius on every object rectangle |
| Palette | `color.illus-*` | ink, paper, base, accent-1..3, shadow | Neutrals plus 2–3 accents, 4–7 colors per piece. Accents are *less saturated* than interactive UI color, and the button color never fills a large area (IL-07). |
| Shading | n/a | flat | Flat with one shadow tone. No blend modes. No blur filters. |
| Shadow | `illus.shadow-x`, `illus.shadow-y`, `color.illus-shadow` | 0, 4 px, 12% ink | A flat offset copy of the shape. Packs make it hard (`loud`), soft (`frosted`) or none. |
| Light source | n/a | top-left | Fixed for the whole set |
| Perspective | n/a | flat 2D | Flat *or* isometric (30°, 86.6% vertical scale), one per set |
| Grid and details | n/a | 4 px grid | Shapes and gaps ≥8, details ≥4. Angles from 15/30/45/60/75/90°. |
| Text in art | n/a | none | No text: it can't be translated and isn't read aloud (IL-09) |
| People | n/a | none in the kit | If you add people, use realistic proportions (about 8 heads tall) or one declared stylization. Vary age, body and ability. Use a fixed set of 5–6 skin tones, and outline figures on dark backgrounds (IL-13). |

How the packs change the character:

| Pack | Character |
|---|---|
| `quiet-editorial` | Monochrome, hairline (1.5) |
| `signal-dark` | Thin (1.5), square caps |
| `kinetic-studio` | Heavy (2.5), square, sharp corners |
| `loud` | 3 px strokes, hard 4 px offset shadow, pop colors |
| `frosted` | Soft corners (12) with a soft lift |
| `warm-natural` | Round (14) and gentle |
| `civic-clear` | Plain, no shadow |

## 3. Theming and dark mode
- **Every color is a CSS variable.** The SVG source contains no hex colors (IL-06, enforced by a test).
- Dark mode redefines the `color.illus-*` tokens: paper becomes the raised surface, base becomes a dark brand tint, and accents get darker and less saturated. Strokes thin to 1.75. **The file is never swapped.**
- **Every outlined object sits on a solid paper fill**, so strokes never vanish on a dark surface (IL-08).
- **Forced colors** (Windows high contrast): fills map to `Canvas`, strokes to `CanvasText`, and the shadow copy is hidden (see `index.css`).
- **A brand override only touches the accents.** Ink and paper stay neutral.

```tsx
// Decorative (most empty states): hidden from assistive tech.
<Illustration name="empty-inbox" size="md" />
// Informative: carries meaning, so it gets role="img" and a label.
<Illustration name="secure" size="sm" label="Payments are encrypted" />
```

Adding a new illustration:
- Draw it on the 144 grid, as a JSX fragment in `art`.
- Use `fill('paper' | 'base' | 'accent-1..3')`, `line` and `r` only.
- Wrap the main object in `<Lifted>` to get the flat shadow.
- Never write a hex value, a gradient or text.

## 4. Accessibility and inclusion
- **Decorative** art gets `aria-hidden` (the wrapper does this when there's no `label`). **Informative** art gets `role="img"` and a short label describing its *meaning*. Complex diagrams get a long description in the page text (IL-10).
- Parts needed to understand an *informative* illustration have ≥3:1 contrast against adjacent colors. Decorative pastels are exempt (IL-11).
- **It must not look clickable unless it is.** If it is clickable, it also has a text label (IL-12).
- **Motion:** play once or stop within 5 s, never block input, and show a static frame under reduced motion (IL-15, MT-03/MT-04).
- **Review gestures, symbols, flags, maps, holidays, color meanings and right-to-left direction** for the target locales (IL-14).

## 5. Production
- Set a `viewBox` with no fixed width inside the component (the wrapper sets the size). Name files `name-sm|md|lg` when exporting raster or SVG assets.
- **Exporting from Figma:**
  - Keep strokes live so the stroke token still works, and turn off "include id".
  - Run SVGO v4 with the viewBox kept, IDs prefixed, and 1–2 decimal places.
  - Then replace hex values with `var(--color-illus-*)`, or check the `var()` references survived.
- **Size budgets (raw SVG):** sm ≤2 KB, md ≤4 KB, lg/error ≤12 KB, hero ≤30 KB. The kit's pieces are about 1 KB each. Free marketing libraries are often 6–20× heavier and hard-code their colors.
- **Lottie / Rive only when the motion carries meaning.** The runtimes cost 46–140 KB gz of JS, and Rive also loads 330–900 KB of WASM. Lazy-load the animation, show a static SVG poster first, keep that poster as the reduced-motion fallback, and keep the animation file ≤50 KB JSON. For simple loops, use CSS or SVG animation.
- **Licensing:** record a license per asset. AI-generated art may not be copyrightable, and it can reproduce a likeness, a trademark or an artist's style, so review it before shipping. Some free libraries forbid AI training on their files or repackaging them (IL-20).

## 6. Anti-patterns
- **Generic flat-people scenes** (long limbs, small heads, purple skin): this style is now read as a cliché, even as parody, and audiences scroll past it.
- **Mixed styles on one page**: different stroke weights, perspectives, shading or proportions side by side (IL-04, IL-19).
- **Stock illustrations used as filler.** They're ignored, off-brand and heavy.
- **Hard-coded colors** that break dark mode, and pastel-only art that disappears on dark surfaces.
- **Illustrations that look like buttons**, or that react to hover without doing anything.

## Checklist (IL-01 … IL-22)
| ID | Check |
|---|---|
| IL-01 | It carries information or state; if not, use an icon, a sentence or nothing |
| IL-02 | The role is declared and the size is within that role's range |
| IL-03 | At most 1 illustration per card or region, and 1 hero per page |
| IL-04 | One style family: same stroke, cap, join, radius, perspective, shading and light |
| IL-05 | One stroke weight (two at most), rendering at 1.5–4 px |
| IL-06 | Neutrals plus 2–3 accents, all from tokens; no hex in the SVG source |
| IL-07 | Accents are less saturated than UI action color |
| IL-08 | Dark mode works through variables, objects sit on paper, and both modes have been checked |
| IL-09 | No text in the art |
| IL-10 | Decorative art is `aria-hidden`; informative art has `role="img"` and a label |
| IL-11 | Informative parts have ≥3:1 contrast |
| IL-12 | It doesn't look clickable unless it is, and then it has a label |
| IL-13 | People (if any) are inclusive: tone set, varied bodies, no caricature |
| IL-14 | Cultural and right-to-left review done for the target locales |
| IL-15 | Reduced motion is honored; animation stops within 5 s and never blocks |
| IL-16 | viewBox only, no fixed size inside the asset; consistent naming |
| IL-17 | Optimized and within the size budget |
| IL-18 | Lottie/Rive only with a reason: lazy-loaded, with a poster fallback, within budget |
| IL-19 | No mixing of illustration libraries or styles on a page |
| IL-20 | A license is recorded per asset; AI-generated art has been reviewed |
| IL-21 | No illustration while loading; no-results states are text-first |
| IL-22 | The hero illustration doesn't delay LCP |
