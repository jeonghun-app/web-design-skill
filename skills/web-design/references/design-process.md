# Design process: how a strong designer works

Design curricula, professional career frameworks and design-critique practice agree on a small set of skills and habits. The tools differ between teams; these habits don't. This file turns them into an operating procedure for this skill. Each rule has an ID and a way to check it. `SKILL.md` refers to these IDs, and the definition of done below is the last QA step after the `review.md` scorecard.

## The skills that matter most

The ranking below reflects how consistently the skills appear across curricula and career frameworks.

| Rank | Skill | Covered in |
|---|---|---|
| 1 | Evidence: research, data and stated assumptions | FRAME-*, EVAL-01 |
| 2 | Interaction design: flows, tasks, *every state*, errors | STATE-*, `app-patterns.md` |
| 3 | Visual design and hierarchy | HIER-*, `visual-craft.md` |
| 4 | Prototyping at the right fidelity | FIDELITY-* |
| 5 | Systems thinking: patterns, tokens, consistency | PATTERN-01, `tokens.md` |
| 6 | Critique: giving it, receiving it, acting on it | CRIT-* |
| 7 | Collaboration and handoff | HANDOFF-*, `figma.md` |
| 8 | Usability evaluation | EVAL-* |
| 9 | Communication and rationale | PRESENT-01 |
| 10 | Product thinking and metrics | FRAME-01, MEASURE-01 |
| also | Ideation, accessibility, content design, information architecture, responsive design, ethics | EXPLORE-*, `principles.md`, `content.md`, RESP-01, ETHICS-01 |

Seniority changes the *scope and verbs*, not the skill list. A junior designer applies the style guide. A mid-level designer builds the hierarchy on purpose. A senior designer explains why it works and sets the bar for others. Act at the senior level: explain every decision against a goal.

## The loop

The canonical sequence is a loop, not a waterfall: **diverge before you converge** (on the problem, then on the solution), **raise fidelity only as confidence grows**, and **test the riskiest assumption first**.

| Step | What you produce |
|---|---|
| Brief | Problem statement, job to be done, success metric, constraints, must / should / could (FRAME-*) |
| Discover | What's known: analytics, research, category leaders (TR-02), the riskiest assumptions |
| Define | Content priority list (CONTENT-01), user flows, state matrix (STATE-01) |
| Ideate | 3–5 structurally different directions (EXPLORE-01) |
| Wireframe | Low-fidelity frames in grayscale (FIDELITY-01) |
| Visual and system | Tokens, trend pack, components (`tokens.md`, `trends.md`) |
| Prototype and test | Running React pages; `audit.mjs`; a 5-second test (TR-01) |
| Critique | The scorecard in `review.md` and a decision log (CRIT-*) |
| Handoff | Spec, states, tokens, accessibility notes, deferred scope (HANDOFF-*) |
| Learn | A metric readout plan (MEASURE-01) |

## Rules

### Framing, before any pixels
| ID | Rule | Check |
|---|---|---|
| FRAME-01 | Write a 5-line brief: **user · job to be done · how today fails · success metric · constraints**. | Every field filled; the metric is measurable. It lives in `design/brief.md`. |
| FRAME-02 | If the request names a solution ("add a carousel"), restate the underlying need ("show more products without scrolling past the CTA") and design for the need. | The brief records both the request and the restated need. |
| FRAME-03 | List the 1–3 riskiest assumptions and how each will be checked. | Assumption list with a check method for each. |
| FRAME-04 | Split the scope into must / should / could. Finish *must* before polishing anything. | The table exists, and deferred items are logged. |

### Content first
| ID | Rule | Check |
|---|---|---|
| CONTENT-01 | Use **real or realistic content**, never lorem ipsum. Rank it by importance before layout. Test the shortest and longest cases. | No "lorem" anywhere; the priority list exists. |
| CONTENT-02 | **Design the core first** (the epicenter: the thing the page is for). Add navigation and chrome last. | The first frame contains only the core. |
| CONTENT-03 | Write copy as part of the design, in the users' words (`content.md`). | No jargon. Buttons are outcome verbs. Errors say how to fix them. |

### Explore before refining
| ID | Rule | Check |
|---|---|---|
| EXPLORE-01 | Explore **3–5 structurally different directions** at low fidelity, varying layout, information architecture or the signature move, not only color. Merging the best parts of several directions beats picking the single best one. | At least 3 directions, each with a one-line rationale. In Figma they go on the "💭 Explorations" page. |
| EXPLORE-02 | **Explore internally, present one recommendation.** Put alternatives in an appendix with what you took from each. | The proposal names its sources. |
| EXPLORE-03 | When stuck, sketch 8 thumbnails in 8 minutes before going deeper on any one. | A thumbnail board exists for new surfaces. |

### Fidelity in stages
| ID | Rule | Check |
|---|---|---|
| FIDELITY-01 | **Solve hierarchy with size, weight and space before color.** Work in stages: wireframe, then grayscale hierarchy, then tokens and trend, then polish. | A grayscale render passes HIER-01 before color is judged. Toggle the pack to `quiet-editorial` or desaturate the screenshot. |
| FIDELITY-02 | Prototype only the risky part, in React when interaction realism matters (that's what the template is for). | Prototype scope maps to FRAME-03. |

### Visual craft (details in `visual-craft.md` and `principles.md`)
| ID | Rule | Check |
|---|---|---|
| HIER-01 | **Squint test.** Blur the screenshot by 5–10 px. The intended element still reads first, and the groups stay visible. | Open the audit screenshots blurred, or apply a CSS `filter: blur(8px)` to the page. |
| HIER-02 | Per region: ≤3 text sizes, ≤2 big elements, ≤3 contrast levels. Emphasize by de-emphasizing the rest. | Count sizes and weights per section. |
| HIER-03 | No naive `label: value` lists. Let the value carry the weight and the label recede (or disappear when the value is self-explanatory). | Review every data display. |
| LAYOUT-01 | Every spacing value comes from the 4 px scale. Gaps between groups are larger than gaps within them (LA-02). | `figma-lint` L03/L04 checks Figma; reviewing for raw px in code checks the build. |
| COLOR-01 | Every color is a token. No inline hex, in code or in Figma (L01, L06). | Lint: Tailwind's palette is removed, so raw colors don't compile. |

### Behavior
| ID | Rule | Check |
|---|---|---|
| STATE-01 | **Design every state:** rest, hover, focus, pressed, selected, disabled, loading, empty, error, overflow (long text and many items), permission-limited. | A state matrix with no blank cells. Figma components carry `State` variants (L29). |
| STATE-02 | Feedback within 100–400 ms. Exit or undo on destructive and multi-step flows. | `principles.md` RE-* and FE-03. |
| PATTERN-01 | **Reuse system components and conventions.** A new pattern needs a written justification. | Every element maps to a component or carries a divergence note. |
| RESP-01 | The same information and actions at every breakpoint. Phones hide nothing essential. | Audit screenshots at 375, 768 and 1440 with an action-parity check. |
| A11Y-01 | Keyboard, visible focus, logical order, text alternatives, targets, reflow, reduced motion. | `audit.mjs` (0 MUST) plus a keyboard walk-through. |
| ETHICS-01 | No dark patterns, and collect only the data you need. | `conversion.md` DP-*. |

### Quality loop and delivery
| ID | Rule | Check |
|---|---|---|
| EVAL-01 | Do a heuristic pass (system status, user control, consistency, error prevention, recognition over recall, minimalism, error recovery) and **at least 2 revisions** before calling it done. Each round of revision measurably improves usability. | A findings table with severity, plus a version log. |
| CRIT-01 | Self-critique in the form **"Given goal X, Y hurts because Z; try W."** Never "I don't like it." | Every log entry references a goal. |
| CRIT-02 | When asking a human for feedback, say what's in scope, what's out, and ask 1–3 specific questions. | The request follows that template. |
| CRIT-03 | Log which feedback you accepted or declined, and why. | Decision log. |
| PRESENT-01 | Present in this order: **current state → why it fails → the solution → rationale → risks and what's next.** | The structure of the summary, PR or presentation. |
| HANDOFF-01 | Handoff includes flows, the state matrix, tokens, non-obvious behaviors, accessibility notes and deferred-scope issues. | The template is filled (`figma.md` Flow B and Dev Mode status). |
| HANDOFF-02 | After the build, review the implementation in every mode and breakpoint and label intentional deviations. | Build-review checklist (`review.md`). |
| MEASURE-01 | Tie the result back to the FRAME-01 metric and propose how to measure it (events, funnels). | Event and metric names listed. |

## Critique: how to run it, including on your own work
1. **Restate the context** in about 5 lines: goal, users, constraints, what feedback is wanted, and what's out of scope.
2. **Ask clarifying questions before giving feedback.**
3. **Feedback rounds:** each person gives 2 strengths and 1 improvement, each tied to a goal. Separate personal preference from user need. Critique the work, not the person.
4. **The presenter listens and records** instead of defending.
5. **Follow up** with action items. Next time, show what changed because of the critique.

**Question bank**
- What scenarios is this for? Walk through each one.
- Where will people struggle, and why?
- Is the style right for this audience?
- Does it reuse what people already know (prototypicality)?
- What are the pros and cons of each option? Is there a hybrid?
- What needs research?
- Is the hierarchy clear, and are similar items grouped?

## Definition of done (all must hold)
- The problem and success metric are stated (FRAME-01).
- It follows system patterns, or the divergence is justified (PATTERN-01).
- Every state is designed (STATE-01). Every breakpoint keeps parity (RESP-01).
- It works in light and dark through semantic tokens. `trend.mjs check` passes.
- `audit.mjs` shows 0 MUST. Accepted SHOULDs are written down.
- The `review.md` score is ≥7.0, and R6 is not 0.
- The copy has been reviewed (`content.md`). No placeholders remain.
- The Figma library or screens are lint-clean (`figma-lint.mjs`, no E findings) and marked Ready for dev.
- Deferred scope is filed, and the measurement plan is written down (MEASURE-01).
