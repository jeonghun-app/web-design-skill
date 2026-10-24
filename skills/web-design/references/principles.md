# Principles: how people see, decide and act on a screen

This layer stays the same when trends change. Every visual decision should trace back to one of these mechanisms. Rule IDs are referenced by `scripts/audit.mjs` and by reviews.

**Levels**
- **MUST**: accessibility law (WCAG 2.2 AA) or failure blocks users. Never trade it for style.
- **SHOULD**: strong or replicated evidence. Deviate only with a written reason.
- **MAY**: convention or weak evidence. A default, not a rule.

## The interaction loop

Every interaction runs the same loop. Design for each stage.

```
 SEE ───────────► UNDERSTAND ─────────► DECIDE ─────────► ACT ──────────► FEEL FEEDBACK
 eyes find a      brain groups and      fewer, clearer    hand/thumb      response within
 focal point      reads structure       options win       reaches target  100 ms closes the loop
 (salience,       (Gestalt, layer-      (Hick, recog-     (Fitts, target  (state change, motion
 hierarchy)       cake scanning)        nition > recall)  size, reach)    that explains change)
```

### 1. Eyes: attention goes to contrast, size, position and motion
- Only the fovea (about 2° of vision) sees sharply. People make 3–4 jumps (saccades) a second and read in fixations. A layout has to survive peripheral, low-resolution viewing: big shapes, clear contrast, one dominant element per region.
- **Preattentive features** are processed in under 250 ms, before conscious reading: color, size, orientation, motion and enclosure. Spend them on the one thing that matters. Each one you add elsewhere dilutes the focal point.
  - Motion in the periphery is the strongest attention grabber. That is why decorative loops near reading content hurt (MT-05).
- **Scanning patterns** depend on the page:
  - Pages are scanned, not read. On text-heavy pages without structure, scanning follows an F shape.
  - With clear headings, people use the *layer-cake* pattern: they read the headings and skip the bodies.
  - On sparse landing pages, the eye goes from the focal point to the CTA.
  - Design for layer-cake scanning: headings that carry the message, keywords first.
- **First impression**: people judge visual appeal within about 50 ms. Low visual complexity and a layout typical of the category (prototypicality) score highest. Novelty must sit on top of familiar structure, not replace it.
- **Banner blindness**: anything that looks like an ad (boxed, saturated, animated, in the right rail) is skipped, even if it is your key content.

### 2. Understanding: structure is seen before it is read
- **Gestalt**:
  - *Proximity*: things close together belong together.
  - *Similarity*: things that look alike belong together.
  - *Common region*: a shared background or card groups things, and it beats proximity.
  - *Continuity*: elements on a line or curve are seen as one path.
  - Use spacing as the primary grouping tool: space *between* groups is at least twice the space *within* them.
- **Reading comfort**: 45–75 characters per line (about 40 for CJK), line-height 1.4–1.6, left-aligned prose. Centered text forces every line to start in a new place.
- **Working memory** holds about 4 chunks, not "7±2". Chunk long numbers. Group form fields. Don't make users carry information from one screen to the next.

### 3. Decision: reduce the cost of choosing
- **Hick–Hyman**: decision time grows with the log of the number of equally likely options. The fix is grouping, ordering and a highlighted default, not a hard cap.
- **Recognition over recall**: visible options, examples, recent items and autocomplete.
- **Jakob's law / prototypicality**: users spend most of their time on other sites. Logo top-left, nav at the top, cart and account top-right, legal in the footer.
- **Von Restorff**: the one item that differs is remembered. That is why there is exactly one primary button per view.
- **Serial position, peak-end**: first and last items are remembered best, and an experience is judged by its peak and its end. Put the strongest proof early and close with a clear CTA and a good success state.
- **Myths to drop**: the 3-click rule, "users don't scroll" (a large share of viewing time is below the fold), and 7±2 as a menu cap.

### 4. Hands: reach, size and distance
- **Fitts's law**: time to hit a target grows with distance and shrinks with size, T = a + b·log₂(D/W + 1).
  - Make frequent targets big and near the point of attention.
  - Make whole rows and cards clickable.
  - Put related actions next to the object they act on.
- **Mouse vs touch**:
  - With a mouse, screen edges are "infinitely deep" and fast to hit.
  - On touch, edges and corners are the *least* accurate places: corner targets need about 12 mm, versus about 7 mm in the center.
  - People hold phones in several grips and shift between them. Taps cluster in the center, so the old "thumb zone" heatmap is not a reliable guide.
- **Finger size**: errors climb sharply below about 8 mm, and accuracy plateaus around 9–10 mm. On the web, use 44×44 CSS px with 8 px gaps. WCAG 2.2's 24 px is the legal floor.
- **No hover on touch**: anything reachable on hover must also work by tap and keyboard. Actions fire on pointer *up* (click), so users can slide off to cancel.

### 5. Feedback: time is part of the design
- **0.1 s** feels instant, **1 s** keeps the flow of thought, **10 s** is the limit of attention. Interaction to Next Paint (INP) should be ≤200 ms.
- Show nothing for waits under 1 s. Delay any spinner by about 300 ms so it doesn't flash.
  - 1–10 s: a skeleton for content, or a spinner inside the control for a single action.
  - Over 10 s: a determinate progress bar with Cancel.
- **Direct manipulation** (drag, slider, pan): the element tracks the pointer every frame. Animate transform and opacity only.
- **Motion explains change**:
  - Ease-out (decelerate) for things entering, ease-in for things leaving, standard easing for movement on screen.
  - Durations: about 100 ms for micro feedback, 150–250 ms for small elements, 250–400 ms for large surfaces, and nothing over 500 ms.
  - Motion longer than that feels slow, and users wait for it on every interaction.
- **Vestibular safety**: parallax, zoom and large slides can cause nausea for people with vestibular disorders, which are common after 40. Always honor `prefers-reduced-motion`.

### 6. Trust: polish is read as competence
- Consistent alignment and spacing, no broken images, no layout shift, real contact and policy links. Reassurance cues sit next to payment and personal-data fields.
- **Aesthetic-usability effect**: attractive interfaces are perceived as easier to use and are forgiven for small issues. That is the reason to invest in "wow", as long as it never breaks rules 1–5.

## Rules (checked by `audit.mjs` where marked ⚙)

### Typography
| ID | Level | Rule |
|---|---|---|
| TY-01 ⚙ | SHOULD | Body text ≥16 px (17–18 for long reading). No text under 12 px. |
| TY-02 ⚙ | SHOULD | 45–75 characters per line (hard max 80; 40 for CJK). Prose containers use `max-w-(--layout-prose)`. |
| TY-03 ⚙ | SHOULD | Body line-height 1.4–1.6. Headings ≥24 px use 1.0–1.3. |
| TY-04 | MUST | WCAG text-spacing overrides (line-height 1.5, letter-spacing .12em, word-spacing .16em) cause no clipping. |
| TY-05 | MUST | Never disable zoom (`user-scalable=no`, `maximum-scale<2`). Size type in rem. |
| TY-06 ⚙ | SHOULD | Prose is left-aligned. Centered blocks are at most 3 lines. |
| TY-07 | SHOULD | Space above a heading is ≥1.5× the space below it, so the heading binds to its own section. |
| TY-08 | SHOULD | A subheading at least every ~300 words. Key words first in headings and links. |

### Color and contrast
| ID | Level | Rule |
|---|---|---|
| CO-01 ⚙ | MUST | Text contrast ≥4.5:1 (large text ≥3:1), including text over images, gradients and glass. Measure the worst pixel. |
| CO-02 | SHOULD | Long-form body text aims for ≥7:1 (APCA Lc 75+ as an advisory check). |
| CO-03 | MUST | Input borders, focus rings, meaningful icons and chart marks ≥3:1 against their surroundings (`color.border-strong`, `color.ring`). |
| CO-04 ⚙ | MUST | Color is never the only signal: errors get icon plus text, links in prose are underlined. |
| CO-05 ⚙ | SHOULD | A visible label for every field. Placeholders are hints, not labels. |

### Layout and attention
| ID | Level | Rule |
|---|---|---|
| LA-01 ⚙ | SHOULD | One solid (primary) button per viewport-height region. Secondary actions use outline, ghost or link. |
| LA-02 | SHOULD | Within-group spacing ≤ half of between-group spacing. All spacing comes from the 4 px scale. |
| LA-03 | SHOULD | Use common region (card or background) when grouping must survive reflow. |
| LA-04 ⚙ | SHOULD | Value proposition plus primary CTA in the first viewport at 375×812 and 1440×900. Content visibly continues past the fold. |
| LA-05 | SHOULD | Core content never looks like an ad. |
| LA-06 ⚙ | SHOULD | Complexity budget: ≤2 text families, ≤3–4 weights, 1 accent hue plus semantic colors. |
| LA-07 | SHOULD | Category conventions: logo top-left linking home, nav at top, legal and contact in the footer. |
| LA-08 ⚙ | MUST | No horizontal scroll at 320 px (except tables, maps, editors). |
| LA-09 | SHOULD | Clickable things look clickable: buttons have a container, links are underlined or distinct, clickable cards have a hover state. |

### Motor and input
| ID | Level | Rule |
|---|---|---|
| MO-01 ⚙ | MUST | Targets ≥24×24 px, or spaced so a 24 px circle fits (WCAG 2.5.8). |
| MO-02 ⚙ | SHOULD | Touch targets ≥44×44 px (48 for primary or frequent actions). The visual can be smaller if the hit area is extended. |
| MO-03 | SHOULD | ≥8 px between adjacent touch targets. |
| MO-04 | SHOULD | Targets near touch-screen corners and edges are ≥48 px. No tiny "×" in corners. |
| MO-05 ⚙ | SHOULD | On mobile, primary actions live in the middle band of the screen or in a sticky bottom bar, not only top-right. Destructive actions are never next to frequent ones. |
| MO-06 | SHOULD | List rows, menu items and cards are clickable across their full width. |
| MO-07 | SHOULD | Submit sits directly under the last field. Context actions sit next to their object. |
| MO-08 | SHOULD | Hover menus open after ~100 ms of intent, close ≥300 ms after leaving (or use a safe triangle), and also open by click. |
| MO-09 | MUST | Hover and focus popups are dismissible (Esc), hoverable and persistent. |
| MO-10 | MUST | No hover-only functionality. |
| MO-11 | MUST | Every drag or gesture has a single-pointer alternative. Actions fire on pointer up. |
| MO-12 | SHOULD | A drag starts only after 4 px (mouse) or 8 px (touch) of movement. |
| MO-13 | SHOULD | No scroll-jacking. Horizontal scrollers show a cut-off next item plus arrows. Carousels don't auto-advance. |
| MO-14 | SHOULD | CLS ≤0.1. Reserve space for media and async content. |

### Response and feedback
| ID | Level | Rule |
|---|---|---|
| RE-01 | MUST | Every interactive element has hover (pointer devices), pressed, focus and disabled states, visible on the next frame. Figma components carry the same variants. |
| RE-02 | SHOULD | Visual response within 100 ms. INP ≤200 ms. |
| RE-03 | SHOULD | Dragged or tracked elements follow the pointer every frame (transform only). |
| RE-04 | SHOULD | Loading by expected wait: under 1 s nothing, 1–10 s skeleton or inline spinner, over 10 s determinate progress plus Cancel. |
| RE-05 | SHOULD | Skeletons match the final layout (no shift on swap). |
| RE-06 | MAY | Optimistic updates for reversible, high-success actions, with rollback. |
| RE-07 | SHOULD | Submit shows a pending state within 100 ms and ignores repeats. |
| RE-09 | SHOULD | Multi-step flows show "Step n of m" and end on a success state with a next action. |

### Motion
| ID | Level | Rule |
|---|---|---|
| MT-01 ⚙ | SHOULD | Durations: micro 80–150 ms, small 150–250, large 250–400, never >500 ms. Exit ≈ 70–80% of enter. Use the `motion.duration.*` tokens. |
| MT-02 | SHOULD | Ease-out to enter, ease-in to exit, standard to move. Never linear for spatial motion. Use the `ease.*` tokens. |
| MT-03 ⚙ | MUST | Under `prefers-reduced-motion: reduce`, remove parallax, scroll-linked motion, zoom and large slides. Opacity fades ≤150 ms are fine. |
| MT-04 | MUST | Auto-moving content longer than 5 s has a pause control. Nothing flashes more than 3 times per second. |
| MT-05 ⚙ | SHOULD | Motion serves state change, continuity or feedback. No infinite loops near content, except loaders. |
| MT-06 | SHOULD | Animate only transform and opacity. Filters and blur are expensive, so budget them. |

### Cognition and content
| ID | Level | Rule |
|---|---|---|
| CG-01 | SHOULD | Chunk long numbers (groups of 3–4). Forms with more than 6 fields are grouped under headings. |
| CG-02 | SHOULD | Broad, shallow navigation (depth ≤3), grouped and labeled. Don't cap menus at "7". |
| CG-04 | SHOULD | Recognition over recall: defaults, examples, autocomplete, `autocomplete` attributes. |
| CG-05 | SHOULD | At most 2 levels of progressive disclosure, with explicit controls (`aria-expanded`). |
| CG-06 | SHOULD | Make choices comparable: 3–4 plans with one highlighted, sort and filter for more than ~8 items. |
| CG-07 | SHOULD | Labels carry scent ("Download invoice", not "Click here"). |
| CG-08 | MUST | Never ask twice for the same information. Allow paste and password managers. |

### Forms and errors
| ID | Level | Rule |
|---|---|---|
| FE-01 | SHOULD | Validate on blur, then live once a field is invalid. Errors sit next to the field, as text plus icon, linked by `aria-describedby`. |
| FE-02 | SHOULD | Prevent errors with the right `type`/`inputmode`, flexible formats and disabled impossible options. |
| FE-03 | SHOULD | Undo for frequent reversible deletes. Confirm irreversible ones with a verb button ("Delete project"), never "OK". |
| FE-04 | SHOULD | Single column, labels above, submit aligned with the fields. |

### Focus and keyboard
| ID | Level | Rule |
|---|---|---|
| FK-01 ⚙ | MUST | A visible focus indicator on every focusable element (`:focus-visible`, never a bare `outline:none`). |
| FK-02 | SHOULD | Focus indicator ≥2 px with ≥3:1 contrast. |
| FK-03 ⚙ | MUST | Focused elements are never hidden under sticky headers or banners (`scroll-padding-top`). |
| FK-04 | MUST | Follow the WAI-ARIA APG patterns: dialogs trap and return focus and close on Esc; menus, tabs and listboxes use arrow keys. Prefer native elements; use Radix for composites. |

### Trust and first impression
| ID | Level | Rule |
|---|---|---|
| TR-01 | SHOULD | 5-second test: after a 5 s look, people can say what this is and what to do next. Above the fold has one focal point. |
| TR-02 | SHOULD | Low complexity and high prototypicality for the category. Compare with 3–5 category leaders. |
| TR-03 ⚙ | SHOULD | Zero broken images, CLS ≤0.1, spacing only from the scale, contact and policies reachable. |
| TR-04 | SHOULD | Reassurance cues (security, refund policy) sit next to payment and personal-data fields. |

## How trends must respect this layer
A trend pack may change *how* things look: hue, radius, type family, depth, texture and motion character. It may not change *whether* the principles hold. `trend.mjs check` enforces contrast and motion limits on every pack in light and dark mode. `audit.mjs --trends all` re-runs the page rules under every pack.
