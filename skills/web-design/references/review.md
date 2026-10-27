# Design review: the scorecard

Run this after `audit.mjs` passes. The audit proves the *floor*: accessibility and human-factors rules. This scorecard judges the *ceiling*: does the work feel crafted, memorable and right for its audience? Score from the contact sheet (light and dark, mobile, tablet and desktop) and from a live click-through.

## Scoring

Score each criterion 0–3, then compute **total = Σ(weight × score) × 10 / 3**, which gives 0–10.

| ID | Criterion | Weight | 3 looks like | 0 looks like |
|---|---|---|---|---|
| R1 | **Concept: one bold idea** | .15 | One memorable move (the brief's signature) carries brand and content, and you could recognize the product from one screenshot | a generic template |
| R2 | **Typography** | .15 | ≤2 families, a deliberate scale, tracking tuned to size, balanced headings, tabular figures in data, no widows in headlines | default stack, random sizes |
| R3 | **Color and contrast** | .10 | Tokens only, one accent used sparingly, body text at APCA Lc ≥75, dark mode designed rather than inverted | ad-hoc hex values, failing contrast |
| R4 | **Layout and composition** | .15 | A clear grid with deliberate breaks, one focal point per viewport, 4 px rhythm, radius nesting respected | misaligned or cramped |
| R5 | **Motion and interaction** | .10 | Purposeful motion of 150–400 ms on the right curves, reduced motion substituted rather than dropped, every state designed | none, or janky motion |
| R6 | **Usability and accessibility** | .15 | Obvious navigation, visible focus, 44 px targets, LCP < 2.5 s, CLS < 0.1, mobile as good as desktop, audit at 0 MUST | broken on mobile, scroll-jacking, a long preloader |
| R7 | **Content and copy** | .10 | Specific headlines, verb-led CTAs, real imagery, one consistent voice (`content.md`) | lorem ipsum, stock filler |
| R8 | **Consistency and detail** | .10 | One icon style, one light source, every state designed (hover, focus, pressed, disabled, loading, empty, error, 404) | mixed styles, missing states |

**Gates**
- **≥7.0** is ship-ready. **≥8.0** is an award-level contender.
- **R6 = 0 blocks shipping**, whatever the total.
- Any **MUST** finding in the audit blocks shipping.
- R1 below 2 means the work is not yet "wow". Revisit the signature move before polishing anything else.

## Review procedure
1. **Five-second test (TR-01).** Look at the desktop and mobile hero for five seconds, then look away. Write down what the product is and what to do next. If either is unclear, R1, R4 and R7 drop.
2. **Squint test.** Blur the screenshot, or view it at 25%. Exactly one focal point should survive per viewport (LC-06). Groups should separate by spacing alone (LA-02).
3. **State walk.** Tab through the page. Hover and press every control type. Open every overlay. Trigger an empty, a loading and an error state. Each missing state costs points in R5 and R8.
4. **Theme and trend swap.** Toggle dark mode and one other trend. Anything that breaks or looks unconsidered points to hard-coded values, which is an R3 and R8 issue.
5. **Mobile pass.** Thumb-reach the primary action (MO-05). Check that nothing is hover-only (MO-10). Check the 320 px reflow in the audit.
6. **Category check (TR-02).** Put the hero next to 3–5 category leaders, which the brief lists. The design should be clearly better or clearly different, and still read as that category.
7. **Write it up.** Record the score per criterion, the total, the top 3 fixes ranked by impact, and any accepted SHOULD findings with their reasons.

## Report template

```markdown
## Design review: <page/product> · trend <id> · <date>
| R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | Total |
|----|----|----|----|----|----|----|----|-------|
| 2  | 3  | 3  | 2  | 2  | 3  | 2  | 2  | 7.3   |

Audit: 0 MUST · 1 SHOULD (accepted: TY-02 on the legal page, which uses a wide table)
5-second test: "a task queue for teams; start free" ✓
Top fixes:
1. R1: the signature hero motion competes with the CTA. Delay it until after the first paint and cut it to one pass.
2. R4: the bento hero tile has dead space. Crop the UI shot larger.
3. R7: the testimonial is generic. Use a named customer with a number.
```
