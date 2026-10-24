# Visual craft: color, type, layout, depth

The difference between "fine" and "wow" is mostly craft applied consistently. These are the rules and recipes. Values marked *heuristic* are working defaults.

## 1. Color systems in OKLCH

### The 12-step ramp
Every hue (brand, accent, neutral, status) gets 12 steps with fixed roles, so any component can pick a step by its role and not by its look.

| Step | Role | Step | Role |
|---|---|---|---|
| 1 | app background | 7 | interactive border, focus ring |
| 2 | subtle background (cards, sidebar) | 8 | hovered border, strong focus |
| 3 | element background (rest) | 9 | solid fill, the highest chroma |
| 4 | element background (hover) | 10 | hovered solid |
| 5 | element background (active or selected) | 11 | low-contrast text |
| 6 | non-interactive border, separator | 12 | high-contrast text |

**Recipe.** `Lb` is the brand lightness; `H` is the brand hue.

```
L_light = [.993 .982 .958 .932 .904 .870 .820 .750  Lb  Lb-.04  .52  .30]
L_dark  = [.170 .205 .255 .290 .330 .375 .435 .520  Lb  Lb+.05  .78  .93]
chroma  = Cpeak × [.06 .12 .22 .32 .42 .52 .64 .80 1.0 .95 .80 .40]   (dark steps 1–8: Cpeak × 0.85)
C_i     = min(that, the maximum sRGB chroma at (L_i, H))  — light steps hit the gamut ceiling near white
```

Built this way, step 11 on step 2 lands around APCA Lc 74 in light mode and Lc 63 in dark mode. Step 12 on step 2 lands around Lc 96 and Lc 92. Chroma peaks around steps 9–10, not in the middle of the ramp. Hues may drift a few degrees as they darken; blues drift toward violet.

The template's semantic tokens map onto this ramp:

| Step | Token |
|---|---|
| 1 | `bg` |
| 2 | `surface` / `surface-sunken` |
| 6 | `border` |
| 8 | `border-strong` |
| 9 | `primary` |
| 11 | `fg-muted` / `primary-text` |
| 12 | `fg` |

### Making a brand color accessible
For **white text** on a brand fill at 4.5:1, the fill's lightness must be at or below these values:

| Hue | red 25° | orange 50° | amber 75° | green 150° | teal 190° | blue 258° | violet 295° | pink 350° |
|---|---|---|---|---|---|---|---|---|
| max L at 4.5:1 | .589 | .582 | .573 | .551 | .556 | .572 | .586 | .591 |
| max L at 3:1 (large text) | .69 | .685 | .675 | .65 | .655 | .672 | .686 | .693 |

**Rule of thumb:** white text needs a fill at L ≤ 0.55–0.59.

Brand-colored text needs L ≈ 0.50 on light backgrounds and ≈ 0.78–0.82 on dark ones. The `primary-text` token does this for you. Keep the original brand hex for large decorative areas only.

Some brands are bright: yellow, lime, cyan, or a pink above L 0.6. For those, set dark text on the fill (`primary-fg` ≈ L 0.15), not white.

### Neutrals
- **Tint grays toward the brand hue** with chroma 0.005–0.02. Cool brands use hue 250–265; warm brands use 60–80.
- **Gray text on white:**
  - L 0.37 for body
  - L 0.45 for secondary text (7.4:1)
  - L 0.55 as the minimum for small text (4.85:1)
  - L 0.70 is a placeholder at most

### WCAG 2 vs APCA
WCAG 2 contrast is the **legal floor** (`trend.mjs check` enforces it). APCA is a better **design target**. WCAG 2 overstates contrast on dark backgrounds: a gray that passes WCAG on near-black can still read as headline-only in APCA.

| APCA Lc | Use | Minimum size/weight |
|---|---|---|
| 90 | preferred body text | 14 px / 400 |
| 75 | minimum for body text | 18/400, 16/500, 14/700 |
| 60 | readable non-body text | 24/400, 16/700 |
| 45 | headlines, detailed icons | 36/400, 24/700 |
| 30 | placeholder, disabled, solid icons | n/a |
| 15 | dividers, thick focus rings; lower is invisible | n/a |

`trend.mjs check` prints APCA as an advisory: body text below Lc 75, muted text below Lc 60.

### Data visualization
- **Categorical:** at most 6–8 hues. Keep OKLCH lightness within about 0.1 across the set and hues at least 30° apart. Beyond 8, group the data or label it directly. One colorblind-safe set is `#E69F00 #56B4E9 #009E73 #F0E442 #0072B2 #D55E00 #CC79A7`.
- **Sequential:** lightness changes in one direction (0.95 → 0.30), with chroma peaking mid-ramp.
- **Diverging:** two hues around a light neutral midpoint.
- **Never red and green alone.** Add shape, pattern or a direct label (CO-04).

### Gradients that don't band
- Interpolate in OKLCH: `linear-gradient(in oklch, …)`. Add a midpoint stop between complementary hues so the gradient doesn't pass through gray.
- A gradient spanning only 0.05 lightness across 1440 px has about 13 distinct 8-bit levels, which shows as bands. Add 3–5% noise (`effect.grain-opacity`) to large, dark, subtle gradients.

## 2. Dark mode, designed rather than inverted

| ID | Rule |
|---|---|
| DM-01 | Build a separate dark ramp (`L_dark` above). Never invert the light one. |
| DM-02 | The base surface sits at L 0.13–0.18. Pure `#000` is for OLED media viewers only. |
| DM-03 | Elevation is shown by a lighter surface: +0.03–0.06 L per level. Shadows barely show on dark, so add a 1 px border about 0.06–0.08 L above the surface, or an inner top highlight (`inset 0 1px 0 oklch(1 0 0 / .06)`). |
| DM-04 | Primary text sits at L ≈ 0.93–0.96, never pure white for body text (it halates). Secondary text sits at L 0.75–0.80. |
| DM-05 | Accents get lighter (L 0.70–0.82) and lose 15–30% of their chroma. Status colors keep their hue. |
| DM-06 | Check the APCA advisory in dark mode especially. WCAG 2 passes dark pairs that read poorly. |
| DM-07 | Images get `filter: brightness(.9)` or a scrim. Illustrations need dark variants. Variable fonts with a GRAD axis use about −25 in dark mode. |
| DM-08 | Follow the OS preference by default (`index.html` does this) and keep the manual override in settings, not as a prominent header toggle. |

## 3. Typography craft

| ID | Rule | Value |
|---|---|---|
| TC-01 | Body size | 16–18 px in product UI and marketing. Long-form reading may go to 20. Use `text.base` / `text.lede`. |
| TC-02 | Measure | aim for 60–75 characters (`layout.prose` = 34em). Hangul: 35–45 (see `korean.md`). |
| TC-03 | Line-height by size | 12–14 px: 1.5–1.6; 16–18: 1.5–1.65; 20–24: 1.35–1.45; 32–40: 1.15–1.25; 48–72: 1.0–1.1; 96+: 0.9–1.0. Snap to 4 px. |
| TC-04 | Tracking by size (grotesks) | `t_em ≈ −0.0223 + 0.185 × e^(−0.1745 × px)`, so about −0.011em at 16 px, −0.02em at 24 px and −0.022em at 48 px and above. Display text in packs goes to −0.03 to −0.05em. Labels and caps at 11–12 px get +0.04 to +0.08em. |
| TC-05 | Scale | Product UI uses a ratio of 1.2–1.25. Marketing uses 1.333–1.5 with hand-tuned display sizes. `clamp()` only for display and section sizes. |
| TC-06 | Hierarchy | ≤6 text styles (display, h1, h2, h3, body, caption) plus mono. At most 3 heading levels visible per screen. |
| TC-07 | Pairing | Pair by structural contrast (serif display with grotesk body) and match x-heights within ~5%, or use `size-adjust`. At most 2 families plus mono (LA-06). |
| TC-08 | Numerals | `tabular-nums` for tables, prices and timers. Lining figures in UI; oldstyle only in serif prose. |
| TC-09 | Punctuation | Curly quotes, a true ellipsis (…), en dashes for ranges. Never bold and italic together. |
| TC-10 | Line breaks | `text-wrap: balance` on headings, `pretty` on paragraphs (the template does both). No single-word last line in a headline. |
| TC-11 | Variable fonts | `font-optical-sizing: auto`. One variable file beats 3+ static weights. |
| TC-12 | Paragraph separation | Use either an indent or a gap, never both. |

**Free families that hold up at award level**

| Category | Families |
|---|---|
| Neo-grotesk | Inter, Inter Tight, Geist, Manrope, Hanken Grotesk, Schibsted Grotesk |
| Grotesk with character | Space Grotesk, Bricolage Grotesque, Instrument Sans, Familjen Grotesk |
| Humanist | Source Sans 3, Figtree, Atkinson Hyperlegible |
| Serif display | Fraunces (opsz / SOFT / WONK axes), Newsreader, DM Serif Display, Young Serif |
| Serif text | Newsreader, Source Serif 4, Literata |
| Mono | Geist Mono, JetBrains Mono, IBM Plex Mono |
| Korean | Pretendard, SUIT, Noto Sans KR, IBM Plex Sans KR; serif: Noto Serif KR, Gowun Batang |

## 4. Layout and composition

| ID | Rule |
|---|---|
| LC-01 | **Grid.** Desktop: 12 columns, 24–32 px gutters, content 1200–1440 px wide. Tablet: 8 columns, 24 px gutters. Mobile: 4 columns, 16 px gutters and 16–24 px margins. |
| LC-02 | **Rhythm.** 4 px base. Spacing steps 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Line-heights snap to 4 px. |
| LC-03 | **Proximity.** Padding inside a group is at most half the gap between groups (LA-02). |
| LC-04 | **Radius nesting.** `inner = outer − padding`. A 24 px card with 8 px padding holds 16 px corners. If padding ≥ outer radius, inner corners go to about 4 px or square. |
| LC-05 | **Optical alignment.** Shift play icons and arrows 1–2 px toward their point. Circles and triangles overshoot squares by 2–4%. Hang bullets and quotes outside the text edge. Center button labels on cap height, not the line box. |
| LC-06 | **One focal point per viewport.** Make it dominant with 2–3× size contrast, the only saturated color, or about 2× the surrounding whitespace (TR-01). |
| LC-07 | **Deliberate asymmetry.** At most one grid break per section, with everything else strictly on the grid. |
| LC-08 | **Icons.** A 24 px grid with a 20 px live area. One stroke weight (1.5 or 2) and one cap/join style throughout. Match the visual stroke to the text weight. |
| LC-09 | **Imagery.** Art-direct crops per breakpoint (`<picture>`) and crop to the subject. Use one color grade and one light direction across a set. For 3D and illustration, one renderer, one style and one light source. |
| LC-10 | **Border vs shadow.** A border (1 px, about L −0.08 from the background) groups. A shadow means elevation, or that something floats and is interactive. Don't use both heavily on one element. In dark mode, use a border plus a lighter surface (DM-03). |

## 5. Depth: layered shadows

Real shadows are layered. Each layer's blur equals its y-offset, offsets double layer by layer, and alpha drops as elevation rises. The shadow takes the hue of the background, never pure black.

```css
--sc: 220deg 60% 50%;   /* background hue, lower saturation and lightness */
--shadow-low:  0.5px 1px 1px hsl(var(--sc) / .7);
--shadow-med:  1px 2px 2px hsl(var(--sc) / .333), 2px 4px 4px hsl(var(--sc) / .333), 3px 6px 6px hsl(var(--sc) / .333);
--shadow-high: 1px 2px 2px hsl(var(--sc) / .2), 2px 4px 4px hsl(var(--sc) / .2), 4px 8px 8px hsl(var(--sc) / .2),
               8px 16px 16px hsl(var(--sc) / .2), 16px 32px 32px hsl(var(--sc) / .2);
```

- Use one light source per page: y-offset is 2× the x-offset, or x is 0.
- The template's `shadow.card` / `raised` / `overlay` tokens follow this, using oklch alpha tinted toward the neutral hue.
- In dark mode, replace shadows with surface lightness plus a border.

## 6. The "wow" without the noise
- **One bold idea per product**, recognizable from a single screenshot. This is the pack's `signature` plus the brief's signature move.
- Everything else is quiet and exact: rhythm, alignment, type, states.
- **Detail is the multiplier.** Every state is designed: hover, focus, pressed, disabled, loading, empty, error and 404. One icon style, one light source, one voice.
- **Common reasons work reads as average or gets rejected:**
  - a template feel
  - a long preloader or a heavy WebGL hero hiding the content
  - a broken or afterthought mobile layout
  - text unreadable over imagery
  - lorem ipsum or stock photos
  - inconsistent details

Score the work with `review.md` before calling it done.
