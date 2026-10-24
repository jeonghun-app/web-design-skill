# Motion: choreography, component specs, modern CSS, budgets

Motion exists to explain change: where something came from, where it went, and what caused it. It also gives feedback. Everything here is subordinate to the motion rules in `principles.md` (MT-01 to MT-06). Rules marked *heuristic* are working defaults, not measured facts.

## Tokens

| Token | Value | Use |
|---|---|---|
| `motion.duration.micro` | 100 ms (range 70–150) | hover, press, toggle, color change |
| `motion.duration.small` | 200 ms (range 150–250) | tooltip, popover, menu, toast |
| `motion.duration.large` | 300 ms (range 250–400) | dialog, drawer, sheet |
| `motion.duration.reveal` | 400 ms (max 500) | section reveals, page-level transitions |
| `ease.out` | `cubic-bezier(0, 0, 0.2, 1)` | **entering** (decelerate into place) |
| `ease.in` | `cubic-bezier(0.4, 0, 1, 1)` | **leaving** (accelerate away) |
| `ease.standard` | `cubic-bezier(0.2, 0, 0, 1)` | moving on screen, and parking just off-screen (drawers) |
| `ease.spring` | `linear(…)` (see tokens.json) | press release, indicators, playful packs |

A backdrop dim may take up to 700 ms. Nothing the user waits on may exceed 500 ms.

## Choreography rules

| ID | Rule | Check |
|---|---|---|
| MC-01 | **Duration follows distance and size.** As a starting point (*heuristic*): ≤64 px of travel → 150 ms, about 300 px → 250 ms, about 800 px → 350 ms, full viewport → 400–450 ms. | review the component spec |
| MC-02 | **Asymmetry.** Exit runs at 60–80% of the enter duration, with the accelerating curve. Enter uses the decelerating curve. | exit token < enter token |
| MC-03 | **Exits never block.** Once an exit starts, the element stops taking input (`pointer-events: none` or `inert`) and focus returns immediately. | Playwright: close, then click underneath at 0 ms |
| MC-04 | **Stagger.** 20–60 ms per item (default 40), with the whole stagger capped at 300 ms: `interval = min(40, 300 / (n − 1))`. Stagger only the first ~8 visible items; the rest arrive together. | `n × interval ≤ 300` |
| MC-05 | **No stagger on exit.** If you must, reverse the order and halve the interval. Grids stagger outward from the item the user touched. | review |
| MC-06 | **Direction carries meaning.** Moving forward in a hierarchy goes right (left in RTL) or up; going back reverses it. Sheets and drawers enter and leave by the edge they're attached to. Toasts come from the edge they live at. | view-transition types `forward` / `back`; mirror for `dir=rtl` |
| MC-07 | **Shared-element transitions only when the element really persists**, for example a card that becomes its detail page. Only one element per name may be mounted at a time. Position and size move on the spatial spring; content crossfades in the first 30–40% of the duration. | no duplicate `view-transition-name` |
| MC-08 | **Springs for anything interruptible** (drag, reorder, layout change, tab indicators). Fixed durations for opacity and color. | review |
| MC-09 | **Interruption picks up from the current value and speed**, never from zero. CSS transitions reverse naturally. With WAAPI, call `commitStyles()` and then `cancel()` before starting again. Never run two view transitions at once. | toggle 5× in 100 ms: no jump, correct end state |
| MC-10 | **Animate only compositor-friendly properties**: `transform` and `opacity`, plus `filter` and `clip-path` sparingly. For height, use `interpolate-size`, the grid `0fr → 1fr` trick or FLIP. Never set `height` from JS every frame. | Performance panel: no layout during animation |
| MC-11 | **Every motion has a reduced-motion substitute** (table below). "Off" is not a design. | reduced-motion Playwright run |

### Springs

Springs are described by perceived duration and bounce. Physics form uses mass 1, `stiffness = (2π / (visualDuration × 1.2))²` and `damping = 2 × ratio × √stiffness`, with `ratio = max(1 − bounce, 0.05)`.

| Preset | `motion` config | Settles in | Overshoot | Use |
|---|---|---|---|---|
| `snappy` | `{ type: 'spring', visualDuration: 0.2, bounce: 0 }` | ~400 ms | 0 | tab indicators, toggles |
| `ui` (default) | `{ visualDuration: 0.3, bounce: 0.15 }` | ~540 ms | 0.5% | layout changes, press release |
| `surface` | `{ visualDuration: 0.45, bounce: 0.2 }` | ~780 ms | 1.4% | sheets and drawers moved by gesture |
| `playful` | `{ visualDuration: 0.5, bounce: 0.4 }` | ~1050 ms | 9% | playful packs only; never on errors or payments |

A CSS `linear()` spring is fine for fire-and-forget motion. A CSS spring can't carry the velocity of a drag, so use `motion` for anything the user drags.

## Per-component spec

| Component | Enter | Exit | Properties | Reduced motion |
|---|---|---|---|---|
| Dialog | 250 ms. Opacity 0→1, scale 0.96→1, translateY 8→0 px, `ease.out`. Backdrop fades over 200 ms at the same time and leaves last. | 150–180 ms, to opacity 0 and scale 0.98, `ease.in` | opacity, transform | opacity only, 150 ms |
| Drawer / sheet | 300–350 ms from its edge, `ease.out` or the `surface` spring. Gestures keep their release speed. | 200–250 ms back to the same edge, `ease.standard` | transform | 150 ms crossfade in place |
| Popover / menu | 150–200 ms. Opacity, scale 0.95→1 from the anchor side (`transform-origin`), and a 4 px shift away from the anchor. | 100–120 ms, opacity only | opacity, transform | opacity 100 ms |
| Tooltip | 100–150 ms after a 300–500 ms hover delay. No delay if another tooltip was just shown. | 75–100 ms | opacity (plus a 2–4 px shift) | opacity only |
| Toast | 200–250 ms slide from its edge plus a fade. The stack reflows on the `ui` spring. | 150 ms toward the edge. Swipe-to-dismiss keeps its speed. | transform, opacity | fade 150 ms |
| Accordion | 200–300 ms height (`interpolate-size` or a grid transition), content fades in over 150 ms | 150–200 ms | grid rows / height, opacity | instant, or a 100 ms fade |
| Tabs indicator | `snappy` spring, moved with transform (FLIP / `layoutId`) | n/a | transform | jumps instantly |
| Tab panel | 150 ms crossfade, with an optional 8–16 px slide in the direction of the tab | 100 ms | opacity, transform | crossfade only |
| List insert / remove / reorder | `layout` with the `ui` spring. Insert grows, then fades in. Remove fades over 120 ms, then neighbors close the gap. | n/a | transform (FLIP) | instant reflow, keep the fade |
| Page transition | View transition: root crossfade 200–250 ms, forward/back slide of 24–40 px (not full width), shared hero by name | old page out 150 ms | snapshots | root crossfade 150 ms, or none |
| Button press | scale 0.97 within 70–100 ms, spring back on release | n/a | transform | color change only |
| Skeleton → content | crossfade 150–200 ms. Shimmer loop 1.5–2 s. | n/a | opacity, background-position | static skeleton, no shimmer |

The template implements these in `components/ui/*`. Radix `data-state` attributes drive `wd-pop-*`, `wd-fade-*` and `wd-slide-*` keyframes, and tabs and pricing use `motion` `layoutId`.

## Modern CSS recipes (support as of 2026-10)

**Baseline** means the feature works in all major browsers. Anything marked *not Baseline* is progressive enhancement only, and the fallback must be the designed default.

| Feature | Status | Fallback |
|---|---|---|
| View transitions (same document), `view-transition-class`, transition types | Baseline 2025–26 | update the DOM directly |
| Cross-document view transitions (`@view-transition { navigation: auto }`) | not Baseline (no Firefox) | plain navigation |
| `@starting-style` + `transition-behavior: allow-discrete` | Baseline 2024 | element appears instantly |
| Popover API, invoker commands (`commandfor`) | Baseline 2025 | Radix Popover, onClick |
| `<dialog>` | Baseline (widely) | n/a |
| Anchor positioning (core) | in all engines since early 2026, some parts newer | Floating UI (Radix uses it) |
| `interpolate-size` / `calc-size()` | Chromium only | grid `0fr → 1fr` |
| Scroll-driven animations (`animation-timeline`) | not Baseline (no Firefox) | static final state or IntersectionObserver |
| Container size queries, `:has()`, nesting, `color-mix()`, `linear()` | Baseline (widely) | n/a |
| Container style queries | Baseline 2026 | data attributes |
| Relative color syntax, `light-dark()`, `@property`, `text-wrap: balance` | Baseline 2024 | precomputed tokens |
| `text-wrap: pretty` | not Baseline | harmless to ship |
| `field-sizing: content` | Baseline 2026 | JS autosize |
| `prefers-reduced-transparency` | Chromium only | also honor `prefers-contrast: more` and an in-app toggle |
| `content-visibility: auto` | Baseline 2025 | normal rendering |

```css
/* Dialog / popover enter and exit without JS animation */
dialog, [popover] {
  opacity: 0; scale: .96; translate: 0 8px;
  transition: opacity .15s var(--ease-in), scale .15s var(--ease-in), translate .15s var(--ease-in),
              display .15s allow-discrete, overlay .15s allow-discrete;
}
dialog[open], [popover]:popover-open {
  opacity: 1; scale: 1; translate: 0;
  transition-duration: .25s; transition-timing-function: var(--ease-out);
  @starting-style { opacity: 0; scale: .96; translate: 0 8px; }
}

/* Accordion height, everywhere */
.acc { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .25s var(--ease-out); }
.acc[data-open] { grid-template-rows: 1fr; }
.acc > div { overflow: hidden; }

/* Scroll-driven reveal: enhancement only, the final state is the default */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal { animation: fade-up linear both; animation-timeline: view(); animation-range: entry 0% cover 30%; }
  }
}
@keyframes fade-up { from { opacity: 0; translate: 0 24px; } }
```

```ts
// Same-document view transition with direction types; skipped under reduced motion.
import { flushSync } from 'react-dom'
export function navigate(update: () => void, dir: 'forward' | 'back') {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update()
  document.startViewTransition({ update: () => flushSync(update), types: [dir] })
}
```

React's `<ViewTransition>` component only animates updates wrapped in a Transition, `<Suspense>` or `useDeferredValue`. It does not handle reduced motion for you. Check that your React release ships it before you depend on it.

## Performance budget for "wow"

| Item | Budget |
|---|---|
| LCP | ≤2.5 s at p75, mobile and desktop measured separately |
| INP | ≤200 ms; no long task over 50 ms during an interaction |
| CLS | ≤0.1 |
| JS on first load, per route (*heuristic*) | ≤150–170 KB gz for landing pages, ≤300 KB for apps |
| Motion library | `m` + `LazyMotion` ≈ 5 KB at first render. `domAnimation` adds about 24 KB, `domMax` (layout and drag) about 38 KB. The full `motion` component is about 43 KB. |
| WebGL / 3D hero | The poster image is the LCP element (AVIF, `fetchpriority=high`). Load the canvas with `import()` after first paint and only when visible. Cap DPR at 1.5 (2 on desktop at most), use `frameloop="demand"`, and pause off-screen. Show the poster alone under reduced motion, save-data, or ≤4 cores / ≤4 GB memory. |
| `backdrop-filter` | ≤2–3 blurred layers on screen, radius ≤20 px, never on scrolling lists |
| Blur and big shadows | Never animate blur radius or shadow size. Fade in a pseudo-element that already has the shadow. |
| `will-change` | Set it just before animating and remove it after. Never apply it to many elements. |
| Web fonts | ≤2 families and ≤100 KB WOFF2 on the critical path. Preload only the LCP font. Subset with `unicode-range`. `swap` for text, `optional` for decorative faces. Use `size-adjust` fallback metrics so the swap doesn't shift layout. |
| Images | AVIF with a WebP fallback, `srcset` + `sizes`, explicit `width`/`height` or `aspect-ratio`. The LCP image is never lazy. |
| Long pages | `content-visibility: auto; contain-intrinsic-size: auto 600px` on sections below the fold |

```css
/* Fallback metrics so the web-font swap does not shift layout */
@font-face { font-family: "Inter Fallback"; src: local("Arial");
  size-adjust: 107%; ascent-override: 90%; descent-override: 22%; line-gap-override: 0%; }
```

## Reduced motion: substitutes, not just "off"

Keep motion that explains a change of state. Remove motion that travels, zooms, or runs on its own. These are the vestibular triggers to remove:
- parallax
- scroll-linked movement of anything other than the scrolled content
- large-area zoom or scale
- full-viewport slides
- spinning
- flashing (never more than 3 per second)
- autoplaying video
- animated gradients and decorative loops
- 3D camera moves

| Normal motion | Reduced-motion substitute |
|---|---|
| Page slide, shared-element morph | 150 ms root crossfade, or instant |
| Dialog scale and rise | opacity 150 ms |
| Drawer slide | 150 ms crossfade in place. A drag still tracks the finger, without momentum. |
| Popover scale | opacity 100 ms |
| Toast slide | fade 150 ms; the stack repositions instantly |
| Accordion height | instant; content may fade 100 ms |
| Tabs indicator glide | instant jump |
| Scroll reveal, parallax | removed; content visible in its final state |
| Count-up numbers, typewriter text | final value right away |
| Hero video, WebGL, loops | poster; play only on request |
| Skeleton shimmer | static color |
| Spinner rotation | slow opacity pulse, or static "Loading…" plus `aria-busy` |
| Smooth scrolling | instant jump |
| Hover lift | color, shadow or outline change only |

**How to implement it**
- The template's global rule collapses durations under `prefers-reduced-motion: reduce`.
- `motion` users wrap the app in `<MotionConfig reducedMotion="user">`.
- Add a site-wide "Reduce motion" toggle that writes `data-motion="reduce"` on `<html>` and applies the same CSS.
- Auto-moving content longer than 5 s needs a visible pause control (MT-04).
- Video autoplays only when it is `muted playsinline`, reduced motion is off, and save-data is off.

**Testing it**

Run `audit.mjs`. Its 320 px pass uses `reducedMotion: 'reduce'` and fails on any spatial transition still running (MT-03). For components, assert with `document.getAnimations()` that no transform keyframes remain and that every duration is ≤200 ms.
