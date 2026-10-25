# Figma authoring: how to build files that hand off cleanly

`figma.md` covers *syncing* tokens and code. This file covers *how to author* Figma itself: file structure, layout, components, variables and handoff. These are the conventions that professional files and official guidance agree on.
- `scripts/figma-library.mjs` generates a starter library that follows them.
- `scripts/figma-lint.mjs` checks any page against them.

Load the Figma MCP skills before using these scripts:
- `figma-use` for every `use_figma` call
- `figma-generate-library` for libraries
- `figma-generate-design` for screens

## Recent platform changes to know (2025–26)
- **"Absolute position"** is now called **"Ignore auto layout"**. The API still uses `layoutPositioning = 'ABSOLUTE'`.
- **Auto layout has three flows:** horizontal, vertical and **grid** (with row and column spans). Wrap works only with horizontal and vertical.
- **Slots** are a native component property: a nested frame with min/max children and preferred instances. Use slots instead of hidden-layer stacks and detaching.
- **Mode limits** depend on the plan: 1 (Starter), 10 (Professional), 20 (Organization). Up to 5,000 variables per collection.
- **Native variable import/export** uses DTCG 1.0 JSON. **Extended collections** let brands override a shared parent system.
- **Code Connect** (UI and CLI) and the **Dev MCP server** are generally available. Connect every published component.

## 1. File structure

**Product or feature file.** Use these pages, in this order:

| Page | Purpose |
|---|---|
| `Cover` | A 1920×1080 frame with title, short description, status, owners and date. Set it as the file thumbnail manually (the API can't). |
| `🟢 Ready for dev` | Only signed-off work. One **Section per flow**, marked Ready for dev. |
| `🟡 In progress` | Work under way |
| `💭 Explorations` | Ideas, alternatives and rejected options (EXPLORE-01 lives here) |
| `▶ Prototype` | Optional. Prototypes need duplicated screens that would confuse readers of Ready. |
| `---` | Spacer page |
| `🗄 Archive` | Old work |

**Library file.** Use these pages, in this order:

1. `Cover`
2. `Getting started / Changelog`
3. `---`
4. `1 Foundations`: color, typography, spacing and radius, elevation, grid, icons, illustration
5. `---`
6. `2 Components`: one page per family on larger systems
7. `_Base`: private parts
8. `Deprecated`

Library pages show up **alphabetically** in the assets panel. That's why the names carry number prefixes.

**Sections**
- Sections are top-level only. Each flow is one section, which is also one handoff unit: Dev Mode lists sections first.
- Inside a section, place each screen's 375, 768 and 1440 versions side by side.
- Frame names follow `Flow/Screen — width`, for example `Checkout/Payment — 1440`.

**Layer names**
- None needed while exploring. Plain names (card, price, label) while refining.
- Names aligned with the code at handoff. **No default names (`Frame 12`) in Ready sections** (lint L10).

**Versions and branches**
- Save a named version at each milestone.
- On Organization plans, name branches after tickets. Developers join as viewers. Merge after sign-off.
- Keep files small: one main flow per file, and research in a separate file.

## 2. Layout
1. **Auto layout for every container with 2 or more children** in a row, column or wrap (lint L08).
   - Exceptions: layered art, illustrations, charts and freeform canvases. These use a plain frame with constraints.
   - Corner badges and close buttons use "ignore auto layout" plus constraints.
2. **Hug, Fill and Fixed:**

   | Mode | Use for |
   |---|---|
   | Hug | Buttons, chips, labels: anything sized by its content |
   | Fill | Stack items, inputs, card bodies, columns |
   | Fixed | Icons, avatars, media, and top-level breakpoint frames (fixed width, hug height) |

   A Fill child makes its parent stop hugging on that axis, so plan the parent first.
3. **Controls hug their content** with a bound min-height (`size/control-*`). Don't hand-set control heights.
4. **Text boxes** use `textAutoResize` of `HEIGHT` (fill width) or `WIDTH_AND_HEIGHT`. Never use a fixed text box inside fluid auto layout (lint L18).
5. **Spacing and radius come only from variables.** Bind padding, `itemSpacing` and `counterAxisSpacing` to `space/*`, and radius to `radius/*` (lint L02, L03). Off-scale raw values are flagged (L04).
   - **Gotcha:** call `resize()` *before* setting `primaryAxisSizingMode = 'AUTO'`. `resize()` resets the sizing modes to fixed and collapses the frame. The library builder learned this the hard way.
6. **Make layouts responsive with min/max.**
   - Page containers: Fill with a max width of 1200–1280.
   - Card rows: wrap, with a min width per card.
   - Inputs: Fill with a min width.
7. **Breakpoint frames** are 375, 768 and 1440, with layout guides saved as grid styles:

   | Width | Columns | Margin | Gutter |
   |---|---|---|---|
   | 375 | 4 | 16 | 16 |
   | 768 | 8 | 32 | 24 |
   | 1440 | 12 | 80, or a centered 1280 | 24 |

8. **Constraints** only apply to frames without auto layout and to ignore-auto-layout children. Use Left & Right to stretch and Center for overlays. Use Scale only for illustrations.
9. **Use frames, not groups**, for anything structural. Groups have no layout, no padding and no variables (L28).

## 3. Components
1. **Atoms first, then nest them.** Prefix private parts with `_` or `.` so they aren't published.
2. **Naming:**
   - The component set has the *code component's name* (`Button`).
   - Slashes only group (`Forms/Input`, `Icon/Close`).
   - Once variants exist, state and size become **properties**, not name segments.
3. **Variant syntax:** `Property=Value, Property=Value`.
   - Every variant has the same property keys, and each combination is unique (L14).
   - The top-left variant is the default.
   - **Property keys are Title Case and mean the same as the React prop** (`Variant`, `Size`, `State`, `Tone`). Values match the code's enum spelling where practical.
4. **Use variants for real prop differences.**
   - Themes and brands → **variable modes**. Icons → **instance swap**.
   - Keep the matrix small. The library builder's Button is Variant × Size × State = 24. Split a set before it reaches about 30 combinations (L16 warns above 50).
5. **Booleans only toggle visibility** ("Show icon").
   - Prototype interactions can't connect boolean states, so **states you want to prototype (hover, pressed) must be variants**.
6. **Text properties for every user-facing string.** Name text layers identically across variants so overrides survive a swap.
7. **Instance swap** with preferred instances for icons and avatars.
8. **Slots** for repeating or free regions (list items, card bodies, modal content). Set min/max counts (L27).
9. **Expose nested instances** so their properties appear at the top level.
10. **Never detach** (L09). Extend through properties, slots or a new variant.
11. **Document each component** in its `description` (L13), shown in the assets panel and Dev Mode. Cover:
    - its purpose
    - when not to use it
    - accessibility and contrast notes
    - the code import path
12. **Interactive components** carry `State` = Default, Hover, Pressed, Focus, Disabled. **Focus and Disabled are required** (L29). Add reactions: On hover / While pressing → Change to.
13. **Accessibility annotations** (Accessibility category) record:
    - role
    - accessible name
    - heading level
    - focus order
    - alt text

    Touch targets are ≥44 on mobile frames (L20). Text is ≥12 px everywhere and ≥16 for body on mobile (L19). Text contrast is ≥4.5:1 (L21).

## 4. Tokens in Figma
- **Tiers:** primitives (hidden, scopes `[]`) → semantic (what designs bind to) → optional component tokens. Never bind primitives directly (L22).
  - This skill's single `web-design` collection holds the semantic layer with Light and Dark modes (see `figma.md`).
  - Large systems split it into `Primitives`, `Color` (Light/Dark), `Spacing` (Mobile/Tablet/Desktop) and `Component`.
- **Scopes on every variable.** Never `ALL_SCOPES` on semantic tokens (L23).

  | Variable kind | Scopes |
  |---|---|
  | Surface | `FRAME_FILL`, `SHAPE_FILL` |
  | Text | `TEXT_FILL` |
  | Border | `STROKE_COLOR` |
  | Shadow color | `EFFECT_COLOR` |
  | Space | `GAP` |
  | Radius | `CORNER_RADIUS` |
  | Size | `WIDTH_HEIGHT` |

  TIMING and EASING variables don't take scopes.
- **Code syntax on every variable:** `var(--color-…)` for WEB (L23). `figma-sync push` sets it.
- **Modes:** the left column is the default. Show light and dark by setting explicit modes on sibling frames (`setExplicitVariableModeForCollection`), never by building "theme" variants.
- **Styles hold what variables can't:**
  - text styles: typography composites
  - effect styles: multi-layer shadows
  - paint styles: gradients
  - grid styles: layout guides

  Alignment and color are not part of a text style.

## 5. Handoff
1. **Ready for dev:** mark sections with `devStatus = { type: 'READY_FOR_DEV' }` (L24), and set `COMPLETED` once built. Ready pages hold only sections (L25).
2. **Annotations:** use Development, Interaction, Accessibility and Content annotations, with live property pins that stay accurate as the design changes.
3. **Measurements** only where auto layout doesn't already express the intent (optical offsets, max widths).
4. **Code Connect:** every published component is connected (`add_code_connect_map`).
5. **Name parity with code:**

   | Figma | Code |
   |---|---|
   | Component name | Component |
   | Property keys | Props |
   | Variant values | Enum literals |
   | Part layer names | Slot names (`Label`, `Icon`, `Leading`, `Trailing`) |
   | Variable code syntax | CSS custom properties |

6. **Zero raw values** before marking Ready. Run `figma-lint` and fix every **E**.

## Tools

```bash
# 1) variables (Light/Dark) for the active trend
node scripts/figma-sync.mjs push > design/build/figma-push.js            # → use_figma
# 2) starter library, one step per use_figma call, in order (each is idempotent)
node scripts/figma-library.mjs list
node scripts/figma-library.mjs step pages        # Cover, Ready, Explorations, Foundations, Components, _Base, Archive
node scripts/figma-library.mjs step styles       # text styles from text.* and effect styles from shadow.*
node scripts/figma-library.mjs step button       # 24 variants, every fill/stroke/radius/padding/height bound
node scripts/figma-library.mjs step badge        # …field, card
node scripts/figma-library.mjs step foundations  # bound color swatches, type ramp, spacing, radius
node scripts/figma-library.mjs step review       # Light and Dark review frames of every component
# 3) lint any page (read-only); save the returned JSON and format it
node scripts/figma-lint.mjs script --page "2 Components" > /tmp/lint.js # → use_figma
node scripts/figma-lint.mjs report design/build/lint.json               # exits 1 on any E
```

**Lint rules (severity)**

| Severity | Rules |
|---|---|
| **E**: blocks Ready for dev | L01 unbound fill/stroke · L02 unbound radius · L03 unbound padding/gap · L05 text without a text style · L06 unbound text color · L09 detached instance · L14 inconsistent variants · L19 text <12 px · L20 touch target <44 on mobile frames · L21 text contrast |
| **W**: fix before merge | L04 off-scale value · L07 effect without a style · L08 should be auto layout · L10 default layer name · L11 hidden layer · L12 empty frame · L13 missing description · L16 variant explosion · L18 fixed text box · L22 primitive bound · L23 variable hygiene · L24 Ready frame without status · L29 missing Focus/Disabled |
| **I**: advisory | L25 frame outside a section · L30 no cover page |

**Verified in practice:** when the builder's own output (196 nodes) was linted, the only finding was the variant container's default 5 px radius. The builder now binds that radius, and the lint ignores the container's default.
