# Figma ↔ React: one design, two surfaces

Figma and code share **one source of truth: `design/tokens.json` plus the active trend pack**. Figma holds the same tokens as variables with the same names, and components are bound to them. The rule is simple:

> Values flow through tokens. Structure flows through components and Code Connect. Pixels flow through screenshots, and screenshots are only for checking.

Use the official Figma MCP server and load its skills before calling the tools they guard:

| Tool | Load first |
|---|---|
| `use_figma` | `figma-use`, plus `figma-generate-library` for design-system work and `figma-generate-design` for screens |
| `get_design_context` | `figma-design-to-code` |
| `create_new_file` | `figma-create-new-file` |
| Code Connect | `figma-code-connect` |

If no Figma plugin skills are installed, read them from the MCP resources (`skill://figma/<name>/SKILL.md`).

Always call `create_session` with the file key before the first file tool, and pass the returned `sessionId` on every later call.

## Naming contract

| Token path | CSS variable | Figma variable | Tailwind utility |
|---|---|---|---|
| `color.primary` | `--color-primary` | `color/primary` | `bg-primary`, `text-primary` |
| `radius.card` | `--radius-card` | `radius/card` | `rounded-card` |
| `text.display` | `--text-display` | `text/display` (max of the clamp) | `text-display` |
| `motion.duration.small` | `--motion-duration-small` | `motion/duration/small` (TIMING) | `duration-(--motion-duration-small)` |
| `ease.out` | `--ease-out` | `ease/out` (EASING) | `ease-(--ease-out)` |

Every pushed variable gets `codeSyntax.WEB = var(--…)`, so Dev Mode and `get_design_context` hand back the real CSS variable and not a hex value.

Collection: `web-design`, with modes **Light** and **Dark**.
- The trend is not a mode, because Pro plans allow only 4 modes per collection.
- Switching trend rewrites the values in place (`figma-sync push --trend <id>`), so every bound layer restyles at once.
- To compare trends side by side in Figma, duplicate the file or page, or (on Organization plans) add a separate collection with one mode per trend.

Push and pull options and pitfalls:
- `--only color,radius` pushes only some groups. It is fast and keeps the payload small; `use_figma` code is capped at 50 KB.
- TIMING and EASING variables don't accept scopes. The push script skips scopes for them and collects any per-variable error into `report.errors`. Check that it is empty.
- `em` tracking values are not exported, because a Figma FLOAT is absolute. Put display tracking on text styles as a percentage instead: `-0.03em` becomes `-3%`.

What Figma variables cannot hold:

| Value | How it is handled |
|---|---|
| Shadows | Effect styles named `shadow/card`, `shadow/raised`, `shadow/overlay` |
| Gradients (`effect.hero-bg`) | Paint styles |
| `clamp()` type sizes | Exported at the desktop maximum. The mobile minimum is documented in the text style description. |
| Line-height multipliers | Set on text styles |

## Flow A: start in Figma, build in React (design → code)

1. **Read the frame.** Call `get_design_context` (with the screenshot) on the frame, then `get_variable_defs` on the same node. If the design uses raw hex or px values instead of variables, list them; they must map to existing tokens or become new ones.
2. **Reconcile tokens.**
   - Run `figma-sync.mjs pull-script`. Run the printed code with `use_figma` and save the returned JSON to `design/build/figma-dump.json`.
   - Run `figma-sync.mjs pull design/build/figma-dump.json`. Review the diff.
     - Values are compared the way push sends them, with a tolerance, so an untouched round trip reports nothing.
     - Lines marked `!` are derived or fluid tokens (aliases, relative colors, `clamp()`). Edit those in code.
   - Re-run with `--write` to apply the `~` changes to the active trend pack, or to `tokens.json` when no trend is active.
     - Both modes are written explicitly, so a light-only edit never resets dark.
     - Font edits keep the fallback stack.
   - Rebuild with `build-tokens.mjs`.
3. **Map to components.** Match each Figma component to the code component through Code Connect (`get_code_connect_map`). For unmapped ones, find the matching component in `src/components/ui` and add a mapping (`add_code_connect_map`). Build missing components with the variant API (variant × tone × size). Never copy one-off utility soup from the reference code.
4. **Compose sections** from `references/patterns.md`. The reference code from `get_design_context` is a layout hint and must be rewritten with project tokens and components.
5. **Verify.**
   - Run `audit.mjs`.
   - Compare the screenshot from `get_screenshot` with the audit screenshot at the same viewport. Differences must be either intentional (rule fixes, written down) or fixed.
   - If the design violates a MUST rule (contrast, target size, focus), implement the compliant version and report the gap back to the designer as a Figma comment or in the PR.

## Flow B: start in code, publish to Figma (code → design)

1. **Push variables.** Run `node scripts/figma-sync.mjs push --trend <id> > design/build/figma-push.js`, then pass the file's content as the `code` of `use_figma`. Re-running is safe: variables are upserted by name.
2. **Effect, paint and text styles.**
   - Create `shadow/*` effect styles from the shadow tokens.
   - Create text styles for display, h2, h3, lede, base, sm and xs. Bind the font family variable and set size and line-height from the tokens.
   - Follow `figma-generate-library` for order and naming.
3. **Components.**
   - Generate the starter set with `figma-library.mjs` (Button 24 variants, Badge, Field, Card, a foundations sheet, and Light/Dark review frames). It follows `figma-authoring.md`.
   - Lint the result with `figma-lint.mjs` before handoff.
   - Build any further components and the nav, hero and section frames the same way.
   - Give them variants matching the code props, plus states (default, hover, pressed, focus, disabled) per RE-01.
   - Bind every fill, stroke, radius and gap to variables.
   - Connect them to code with Code Connect (`add_code_connect_map`, label React, source `src/components/ui/button.tsx`).
4. **Pages.** For a pixel reference of a running page, call `generate_figma_design` on the dev server URL. Rebuild the page with `use_figma` from the library components, then delete the capture. Use `send_code_to_figma` only when the user wants a runnable Code layer.

## Flow C: the trend changes

1. `trend.mjs apply <id>`: code restyles, and the tokens and the Figma JSON are rebuilt.
2. `figma-sync.mjs push --trend <id>`, run with `use_figma`: Figma restyles in place.
3. Structural differences that tokens can't express live in the pack's `pack.css` (code) and in a component variant property named `trend` (Figma). Keep these rare.
4. Run `audit.mjs --trends <id>` and re-check the screenshots in Figma with `get_screenshot`.

## Figma-side QA checklist
- [ ] No unbound colors, radii or spacing on library components. Check them with a `use_figma` read script that lists `boundVariables` gaps.
- [ ] Mobile frames: interactive layers ≥44×44 (MO-02). Text ≥16 px for body (TY-01).
- [ ] Every interactive component has hover, pressed, focus and disabled variants (RE-01).
- [ ] Contrast pairs pass in both modes (`trend.mjs check` covers the token side).
- [ ] Prototype motion uses the `motion/duration/*` TIMING and `ease/*` EASING variables, and nothing is over 500 ms (MT-01).
