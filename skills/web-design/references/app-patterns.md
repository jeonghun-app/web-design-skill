# App patterns: product UI that works

Product UI is used repeatedly by people who are trying to get something done. Use the *same tokens* as marketing pages, at a different density. The values below are cross-system consensus. Where serious systems disagree, the choice and the reason are stated. The template's `#/app` page demonstrates most of them, and `audit.mjs` checks it with `--pages /,/#/app`.

## Density

|  | Marketing | App (default) | App (compact) |
|---|---|---|---|
| Body text | 16–18 px | 14 px | 13 px |
| Controls | 44–56 px | 36–40 px | 32 px |
| Table rows | — | 44 | 32 |
| Radius | 8–12 | 6–8 | 4–6 |

Touch targets stay ≥44 px on touch devices at every density (MO-02). The template uses `min-h-11 pointer-fine:min-h-9`: 44 px on touch, 36 px with a mouse.

## 1. Shell and navigation

| ID | Rule |
|---|---|
| NAV-01 | **Left sidebar** when there are more than 5 top-level sections or 2 levels of hierarchy. **Top navigation** only for 5 or fewer flat sections. People look at the left half of the screen most of the time, and a vertical list scales. |
| NAV-02 | Sidebar is **256 px** expanded and **48 px** as an icon rail. Remember the collapsed state, toggle it with ⌘/Ctrl+B, and make it an off-canvas sheet below 768–1024 px. |
| NAV-03 | **Mobile tab bar:** 3–5 destinations, each with an icon *and* a label, in a fixed bar with `env(safe-area-inset-bottom)`. Never hide or disable a tab when its content is unavailable. Avoid a "More" tab. |
| NAV-04 | **Breadcrumbs** only for hierarchies 3 or more levels deep. The trail shows *location*, not history. The last item is the current page and is not a link (`aria-current="page"`). For one level, use a back link to the parent. |
| NAV-05 | Tabs that change the URL are navigation links. Tabs that swap panels use `role="tablist"`. Never mix the two in one row. Use a segmented control to switch *views or modes*: ≤5 segments, all text or all icons. |
| NAV-06 | At most 2 levels in the sidebar. Deeper structures use breadcrumbs plus a list/detail split. |
| NAV-07 | Top bar 48–64 px. A **visible search field**, not just an icon, with a shortcut hint (⌘K or `/`). The account menu sits at the far right. |

**Keyboard:**
- Wrap navigation in `<nav aria-label>` and mark the current link with `aria-current="page"`.
- Tabs follow the roving tabindex pattern: Tab enters the list on the active tab, ←/→ move between tabs and wrap around, Home and End jump to the ends.

## 2. Data tables

| ID | Rule |
|---|---|
| TBL-01 | Offer three row densities: **32** compact, **44** default, **56** relaxed (for two-line rows). The header row matches the body rows, and so do the toolbar, bulk bar and pagination. |
| TBL-02 | **Numbers are right-aligned** (header included) and set in `tabular-nums`. Text is left-aligned. Never center text columns. Units stay consistent within a column. |
| TBL-03 | Sorting has three states (none → ascending → descending). A `<button>` sits inside each `<th>`. `aria-sort` goes on the sorted column only. Only that column shows its icon; the others show it on hover or focus. |
| TBL-04 | **Pagination** when people look for or compare specific items, or on long result sets (above about 50 rows). **"Load more" with "Showing X of Y"** for browsing. **Infinite scroll only for goal-less feeds.** It breaks the footer, keyboard use and finding your place again. |
| TBL-05 | **Bulk actions.** A checkbox column comes first, with a select-all box in the header that shows a mixed state when some rows are selected. Selecting rows swaps the toolbar for a bar showing "N selected" and verb+noun actions. Row-level actions are disabled while bulk mode is on. |
| TBL-06 | Make the header sticky. When the table scrolls sideways, also make the first column sticky (`<th scope="row">`) and add edge shadows. |
| TBL-07 | On mobile, in order of preference: horizontal scroll in a focusable, labeled region; a column picker; a card per row; accordion rows. |
| TBL-08 | Three distinct empty states. **No data yet**: explain it and offer Create. **No matches**: "No results for 'X'" with Clear filters. **Error**: explain it and offer Retry. |
| TBL-09 | Inline editing only for single, simple fields. Show the affordance on hover and focus; Enter saves, Esc cancels, each cell is validated. Multi-field edits open a side panel. |

Use a plain `<table>` with tabbable controls for most tables. Reserve `role="grid"` (arrow keys between cells) for spreadsheet-like editing. Announce sort changes and result counts in a polite live region.

## 3. Forms

| ID | Rule |
|---|---|
| FRM-01 | **Labels above fields, one column** (FE-04). Placeholders are never labels. Floating labels and inline labels cause measurable usability problems. Spacing: 24 px between fields, 32 px before a new group, 48 px from the last field to the buttons. |
| FRM-02 | Mark required and optional fields explicitly. The default is to mark whichever group is smaller ("(optional)" when most fields are required), and to do it the same way across the product. Never mark only the optional fields when people can't tell what "unmarked" means. |
| FRM-03 | **Validation timing.** Format is checked on blur; once a field shows an error, it is rechecked on every keystroke (FE-01). Empty required fields are flagged only on submit. Always validate on the server too. |
| FRM-04 | **Error summary** for forms with more than 3 fields. On submit, put a box at the top headed "There is a problem" and move focus to it. Each entry links to its field and uses the same text as the inline error. Prefix the page `<title>` with "Error: ". The inline error stays as well. |
| FRM-05 | **Keep submit enabled.** A disabled button doesn't say what's missing, while submitting shows errors that do. A pending state is fine (RE-07). |
| FRM-06 | **Wizards** for novice users or rare processes. Show the steps and which one is current (RE-09). Name the next step on the button ("Continue to payment"). Let people save and leave. End on a "Check your answers" page. |
| FRM-07 | **Autosave only for controls that act immediately** (toggles, single selects). Everything else uses explicit Save. Never mix the two in one form. Warn about unsaved changes when someone leaves. |
| FRM-08 | **Known dates** (birthdays, documents) use three numeric fields (DD MM YYYY) with `autocomplete="bday-*"`. Use a calendar only when the day of the week matters, and still allow typing. |
| FRM-09 | **Passwords:** see ON-02 in `conversion.md`. Lock the account only after 5–10 failed attempts, and never reveal whether the username or the password was wrong. |
| FRM-10 | **No input masks that block typing.** Accept spaces, hyphens and brackets, and normalize on the server. People enter numbers in many formats even when shown an example. |
| FRM-11 | **Character counter** appears at 75% of the limit. People may type past the limit and then see the error. Raising the limit is better than adding a counter. |

## 4. Feedback

| ID | Rule |
|---|---|
| FB-01 | **Toasts** are for passive success only ("Request archived", about 3 words). Show them for 5 s, or 10 s with an action, and pause on hover or focus. At most 3 visible, at the bottom (bottom-end on desktop). **Never use a toast for errors** or anything critical. The same message must stay findable elsewhere. |
| FB-02 | **Banners** carry system- or page-level messages of 1–2 sentences. **Inline messages** sit next to what they refer to. Validation errors are never shown only in a banner. |
| FB-03 | **Modal only for a critical warning or input needed to continue.** No nested modals. No complex tables or long forms in a modal (use a page or side panel). Never interrupt checkout with one. |
| FB-04 | **Confirm only irreversible or expensive actions.** Common reversible ones get Undo instead (FE-03). Title the dialog with the consequence ("Delete customer?") and give the buttons the action's name ("Delete customer" / "Keep"). Initial focus goes to the least destructive button. For catastrophic actions, make people type the name. |
| FB-05 | **Progress by wait time.** Under 1 s: nothing. 1–3 s: indeterminate. 3–10 s: determinate. Over 10 s: percentage plus Cancel, or a background task (RE-04). |
| FB-06 | **Skeletons** only for containers and data (cards, tables, tiles), never for buttons, inputs or menus. Never show one under ~300 ms, and never as an empty frame. Items load progressively, with one screen-reader announcement per group. |
| FB-07 | **Optimistic UI** only for fast, reversible, likely-to-succeed actions (like, toggle, reorder). Roll back on failure with an inline or toast error offering Retry. Never for payments or destructive actions. |

## 5. Empty states and onboarding

| ID | Rule |
|---|---|
| EMP-01 | Three kinds of empty state. **First use**: what will appear here, plus one primary action. **No results**: a way to recover. **Error**: plain language, no playful illustration, no error codes. Each has a title, 1–2 sentences, one verb+noun action, and optionally "Learn more". |
| EMP-02 | **No forced product tours.** Measured tutorials don't improve task success, and people rate the app *harder to use* after one. Prefer contextual tips shown when needed (one at a time, at most 3–4 steps, triggered by behavior). Tours are worth it only for genuinely new interaction styles. |
| EMP-03 | Onboarding works as an **optional, dismissible checklist** of real tasks with statuses (Not started, In progress, Done), and people can come back to it later. |
| EMP-04 | **404/500**: title "Page not found – <service>". Don't blame the user. Offer next steps or contact details, without technical detail (`content.md` patterns). |

## 6. Search

| ID | Rule |
|---|---|
| SRCH-01 | Show a **visible search field**, not just an icon; making it visible greatly increases how much search gets used. Show recent searches on focus, and keep the query after searching. |
| SRCH-02 | **Autocomplete** follows the combobox pattern: ↓ enters the list, Enter accepts, Esc closes, and the list is not in the Tab order. Show at most ~10 suggestions on desktop and ~8 on mobile, with no scrolling inside the list. Style the typed text differently from the suggested completion, and add scope where useful ("in Desktops"). |
| SRCH-03 | **⌘K command palette**: a modal combobox and listbox. Group results as Recent / Navigation / Actions, show shortcut hints, and use fuzzy matching. Esc returns focus to where it was. It is an **accelerator only**; every command must also be reachable another way. |
| SRCH-04 | **Facets** allow several values each. Applied filters show as removable chips with Clear all. Options stay in place when selected. Apply instantly when results are fast; use an Apply button on mobile or when results are slow (EC-01, EC-02). |

## 7. Settings, account, notifications, permissions

| ID | Rule |
|---|---|
| SET-01 | Settings use two columns from medium widths up (about `2fr 5fr`): label and description on the left, grouped cards on the right. One column on mobile. |
| SET-02 | Toggles take effect immediately. Forms use explicit Save (FRM-07). |
| SET-03 | A **notification center** keeps a persistent history of transient messages (toasts must be findable later). Badges show counts. Never send the same notification twice. |
| SET-04 | **Roles** are a radio choice with descriptions, not a wall of raw permission checkboxes. Show the controls someone can't use, with a reason on a focusable element; don't hide core actions. Confirm before people reduce their own access. |
| SET-05 | Account deletion and subscription cancellation are reachable within one click of the signed-in home (DP-04). |

## 8. Dashboards

| ID | Rule |
|---|---|
| DSH-01 | Use length-based charts (bars, lines). Avoid area, pie and 3D for comparisons. Color separates categories but doesn't encode order. See `visual-craft.md` for chart palettes. |
| DSH-02 | **KPI cards**: label, value in tabular figures, and the change against the comparison period shown with direction *and* an icon or sign, not color alone (CO-04). Optional sparkline. 3–5 per row, most important first. |
| DSH-03 | **Time range**: presets (Today, Yesterday, Last 7 days, Last 30 days, Custom), a two-month calendar for custom ranges, Cancel/Apply, and optional comparison with the previous period. |
| DSH-04 | Show "Updated 3 min ago" with a manual refresh; no pulsing auto-refresh. Load modules progressively, simplest first, with spinners inside individual modules rather than over the whole page. |

## 9. Overlays

| Element | Size |
|---|---|
| Dialog | **sm 400 px · md 600 · lg 800**. On mobile, full width minus 32 px, or a bottom sheet. The header and footer stay fixed while the body scrolls. |
| Drawer / side sheet | 320 (narrow) · 400–600 (forms) · up to 940 (rich detail) |
| Tooltip | max 200–280 px wide, plain text only |
| Popover | max ~280–320 px unless it holds a form |

| ID | Rule |
|---|---|
| OVL-01 | **Tooltip timing:** open after **300 ms**, close after 100–150 ms, and open instantly when moving to a neighboring trigger within 300 ms. Tooltips also show on focus, dismiss with Esc, and stay open while hovered (MO-08, MO-09). They never contain interactive or essential content; use a popover for that. |
| OVL-02 | **Dialogs:** focus moves inside on open (to the first field, or to the least destructive button for irreversible actions). Tab is trapped inside; Esc closes; focus returns to the trigger; the dialog is labeled by its title (FK-04). |
| OVL-03 | **Stacking:** content < sticky (100) < drawer (200) < modal (300) < popover (400) < toast (500) < tooltip (600). Use the `layer.*` tokens (`z-(--layer-modal)`) and portals or the native top layer instead of ad-hoc z-index values. |

## Where the systems disagree, and the choice made here

| Topic | Options in use | Choice and reason |
|---|---|---|
| Validation timing | on blur vs only on submit | Format on blur, empty fields on submit, server always. This keeps feedback fast without early nagging. |
| Disabled submit | never vs allowed for short forms | Never. A disabled button hides *why*. |
| Toast position | bottom (most) vs top-right | Bottom, bottom-end on desktop. It keeps notices away from the primary navigation and in thumb reach. |
| Toast duration | 1.5–8 s, or until dismissed | 5 s, 10 s with an action, paused on hover and focus. |
| Tooltip open delay | 50–700 ms | 300 ms, with instant handoff between neighbors. |
| Default row height | 36 / 44 / 48 | 44. It works for touch and mouse; offer 32 as compact for experts. |
