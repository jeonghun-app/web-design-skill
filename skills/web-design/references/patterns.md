# Patterns: sections and components that work, and why

Every pattern here recurs across several independent, well-regarded publishers. Measurements are desktop at 1440 px unless noted. Each pattern lists:
- the **problem** it solves
- the **mechanism** behind it (see `principles.md`)
- the **anatomy and measurements**
- **when not** to use it
- where it lives in the template (✅ built, ☐ build it yourself on the same tokens)

## Page grammar (marketing)

The page follows the visitor's questions in order: *What is it?* → *Can I trust it?* → *What does it do for me?* → *Proof?* → *What does it cost?* → *What if…?* → *Go.*

```
nav → hero → logos/proof → features (bento or chapters) → stats → testimonial
    → pricing → faq → closing CTA → footer
```

- Drop sections the product doesn't need. Never add sections with nothing true to say.
- Keep the order. It matches the layer-cake scan, where headings alone should tell the whole story (TY-08).
- Section rhythm: `layout.section-y`, which is 64 px on mobile and 96–128 px on desktop.

### Nav ✅ `sections/nav.tsx`
- **Problem:** wayfinding, plus a conversion path that stays in reach.
- **Mechanism:** prototypicality (LA-07), and Fitts's law for a CTA that is always reachable.
- **Anatomy:**
  - Logo top-left, links home.
  - 3–7 top-level items, grouped. Use a mega-menu only if there are more than ~10 destinations, and then group it (CG-02).
  - Right side: a ghost "Sign in" and one solid CTA.
- **Measurements:** height 64 px (range 56–72). Sticky. A translucent background with blur is optional, with a solid fallback. Mobile menu rows are ≥48 px.
- **Don't:** use it on single-task pages such as checkout, sign-up or sunset notices. There, a logo-only header avoids exits.

### Hero ✅ `sections/hero.tsx`
- **Problem:** the first 50 ms decides whether people stay.
- **Mechanism:** one focal point. Size is the first fixation, then the eye goes to the CTA (TR-01, LA-01, LA-04).
- **Anatomy:**
  - Optional eyebrow badge.
  - **H1 ≤ ~60 characters**, one sentence.
  - Lede of 1–2 sentences.
  - **1 solid CTA plus 1 secondary** (outline or ghost), same height.
  - A reassurance line ("free for…, no card").
  - A visual.
- **Measurements:**

  | Element | Value |
  |---|---|
  | Display size | `text.display`: clamp 40→72 px (median ~64 at 1440) |
  | Display tracking | −0.02 to −0.04 em (tighten more as size grows) |
  | Display line-height | 1.0–1.1 |
  | Lede | 18–20 px at ≤60 ch |
  | CTA height | 44–56 px |

- **Variants** (pick one):
  1. **Product-as-hero.** A real screenshot or a coded UI frame (radius 8–12, 1 px border at low alpha). Best when the product's UI *is* the pitch. Recognition beats description.
  2. **Functional hero.** The first step itself as the hero: a search, composer or calculator input 640–768 px wide and 48–56 px tall, with 4–6 suggestion chips. Best when trying is cheap.
  3. **Poster.** Centered name, one tagline, two pill CTAs and full-bleed media. Best for a portfolio of products or an emotional purchase.
  4. **Statement.** Editorial serif headline with commissioned illustration. Best for brand-led, mission-led companies.
- **Don't:**
  - Multi-sentence H1s, or more than 2 CTAs.
  - Autoplay video without a pause control and a still frame under reduced motion (MT-04).
  - Cookie banners that cover the CTA. Use a bottom bar that keeps the hero visible.

### Logo wall ✅ `sections/logos.tsx`
- **Problem:** the trust gap with a new vendor.
- **Mechanism:** borrowed authority, placed at the point of doubt, right after the claim.
- **Anatomy:** a quiet label ("Trusted by teams at") and 5–8 monochrome logos in one row.
- **Measurements:** 24–32 px logo height. Muted color that still meets 3:1 if the logos are text. An auto-scrolling marquee needs a pause control.
- **Don't:** use logos the audience won't recognize. Consumer audiences trust ratings and user counts more.

### Bento grid ✅ `sections/bento.tsx`
- **Problem:** many parallel capabilities.
- **Mechanism:** tile size encodes priority preattentively. Common region groups each tile (LA-03).
- **Anatomy:**
  - 4–6 tiles on a 12-column grid (spans 4/6/8, or 2×2 for the hero tile).
  - Each tile: title (1 line), one sentence, and a real UI crop or a purposeful visual.
- **Measurements:** gap 12–24 px. Radius `radius.card` (12 is the most common; 16–24 in playful packs). Padding 24–32 px. 2–3 rows. A single column on mobile, with the hero tile first.
- **Don't:** use it for sequential features (use chapters or steps), fewer than 3 items, or tiles with only an icon and filler text.

### Feature chapters ☐
- **Problem:** a long page needs rhythm.
- **Mechanism:** a predictable schema lowers scan cost. Each chapter answers one question.
- **Anatomy:** a repeated [title + copy] → full-width media block, or alternating left/right.
- **Measurements:** section padding 80–128 px. Title 32–48 px. Copy 16–18 px at 54–68 ch.
- **Don't:** use fewer than 3 chapters. On mobile, chapters collapse to a stack.

### Sticky scroll story ☐ (signature-move candidate)
- **Problem:** one idea per screen in a narrative.
- **Anatomy:** a sticky step list on one side and swapping media on the other. 3–5 steps.
- **Rules:**
  - Use IntersectionObserver or CSS scroll-driven animation. **No scroll-jacking** (MO-13).
  - Content must be readable without the effect: provide a static stacked fallback under reduced motion and without JS.
- **Don't:** use it for SEO-critical copy, or for content that only appears through animation.

### Stats band ✅ `sections/stats.tsx`
- **Problem:** claims feel abstract.
- **Mechanism:** concrete numbers anchor judgment and are scanned before prose.
- **Anatomy:** 3–4 numbers (40–80 px) with 14–16 px labels, often on a contrasting band.
- **Don't:** use numbers that are small, unverifiable or need footnotes you can't show.

### Testimonial ✅ `sections/testimonial.tsx`
- **Problem:** peer proof.
- **Mechanism:** a specific, named person beats anonymous praise (credibility).
- **Anatomy:** one quote of ≤3 lines at h3 size, then avatar, name, role and company.
- **Don't:** use a wall of vague quotes, or an auto-rotating carousel (MO-13).

### Pricing ✅ `sections/pricing.tsx`
- **Problem:** choosing a plan.
- **Mechanism:** comparable options plus a highlighted default (CG-06, Von Restorff).
- **Anatomy:**
  - A billing toggle (radiogroup) and 3 plans (4 at most).
  - The recommended plan is highlighted (ring plus badge) and is the only solid CTA.
  - Same feature order in every column.
- **Measurements:** price 32–48 px. Card padding 32. Feature rows 14–16 px.
- **Don't:** use it for enterprise-only pricing. Use a "Talk to sales" path instead.

### FAQ ✅ `sections/faq.tsx`
- **Problem:** last objections.
- **Anatomy:** native `<details>`, with the whole row as the target (≥56 px), at most 6–8 items, answers at ≤68 ch.

### Closing CTA ✅ `sections/cta.tsx`
- **Problem:** catch the reader at the end-of-scroll decision.
- **Mechanism:** the peak-end rule.
- **Anatomy:** repeat the hero promise in new words, with one CTA. Use a contrasting panel (radius `panel`).

### Footer ✅ `sections/footer.tsx`
- **Anatomy:** brand plus a one-line blurb, then 3–4 link columns, then a legal row.
- **Measurements:** links ≥44 px tall on touch (32 on fine pointers). Legal text ≥12 px at ≤80 ch (don't stretch footnotes across 1200 px).

## App grammar (product UI)

Marketing and product UI share the tokens but not the density:

| | Marketing | App |
|---|---|---|
| Body text | 16–18 px | 13–14 px (≥16 px in inputs on mobile, to avoid iOS zoom) |
| Controls | 44–56 px | 32–36 px (with a 44 px hit area on touch) |
| Rows | | 32–36 px |
| Radius | 8–12 | 6–8 |

### App shell ☐
- **Anatomy:**
  - Left sidebar 240–300 px: groups with 11–12 px muted labels, rows 32–36 px, its own scroll, collapsible groups.
  - Top bar 48–64 px: search with a visible shortcut hint (⌘K or `/`), an optional assistant entry, and the account menu.
  - Content prose ≤70 ch.
- **Mobile:** the sidebar becomes a drawer (Radix Dialog), and the top bar keeps search.
- **Don't:** use a sidebar for fewer than ~10 destinations. Use top tabs.

### Command palette ☐
- **Problem:** many actions, expert users.
- **Mechanism:** recognition (type to filter) over recall of menu locations.
- **Anatomy:** a modal (Radix Dialog) with an input, then grouped results with keyboard hints. Arrow keys, Enter and Esc work (FK-04). Show recent items first.

### Three-pane work surface ☐
- **Anatomy:** nav 220–280 | list (flex) | detail or inspector 320–400 (collapsible).
- **Measurements:** 13 px text, 28–32 px rows, 1 px separators at low alpha.
- **Don't:** use it for sequential or wizard tasks.

### Data table ☐
- **Anatomy:**
  - Header: title, search, filters, primary action, and a bulk-action bar on selection.
  - Body: sticky header row, sortable columns with `aria-sort`, and an expandable row as an option.
  - Footer: pagination with a "rows per page" control.
- **Recipes:** create, read and update each come as a modal, drawer or page. Delete gets a confirm dialog that names the object (FE-03).

### Loading, empty and error states ☐
- **Skeletons** match the final geometry (RE-05) and appear only after about 300 ms.
- **Empty states** say what this is, why it's empty, and give one primary action.
- **Errors** say what happened, what to do, and offer a retry.

### Forms ✅ `components/ui/field.tsx`
- Single column, label above, hint below.
- The error replaces the hint, as an icon plus text with `aria-describedby`, and appears on blur (FE-01).
- Submit sits under the last field (MO-07). Group the fields when there are more than 6.

## Component inventory

Build these on the same variant API: `variant` × `tone` × `size`, plus `shape` and `asChild`. Every component emits `data-slot` and `data-variant`.
- Use **Radix** for anything with focus management or a composite keyboard pattern.
- Adapt MIT-licensed sources (for example shadcn/ui) with attribution. Never paste paid kit code.

| Group | Components | Status |
|---|---|---|
| Actions | Button (`solid/soft/outline/ghost/link` × `brand/neutral/danger` × `sm/md/lg/icon`), icon button, button group, link | Button ✅ |
| Forms | Field (input), Textarea, Select (Radix), Checkbox, Radio group, Switch, Fieldset | Field ✅ |
| Overlays | Dialog, Drawer/Sheet, Dropdown menu, Popover, Tooltip (all Radix) | ☐ |
| Disclosure | Tabs (Radix), Accordion (`<details>` or Radix) | FAQ uses `<details>` ✅ |
| Display | Card ✅, Badge ✅, Avatar, Alert, Toast, Table, Separator, Progress, Skeleton, Kbd | partial |
| Navigation | Navbar ✅, Sidebar, Breadcrumb, Pagination, Stepper | partial |
| Motion | Reveal (IntersectionObserver plus tokens) ✅, layout spring (`motion` `layoutId`) ✅ in pricing | |

## Measurement defaults (already the base tokens)

| Item | Value |
|---|---|
| Spacing | 4 px base |
| Container | 1280 (product-heavy 1344, story 1200) |
| Gutters | 16 / 24 / 32 |
| Control heights | 32 / 40 / 48. Touch hit area ≥44 |
| Radius | control 8, card 12, panel 20, pill 9999 (all derive from `radius.base`) |
| Type | display 40→72, h2 30→44, h3 20→24, lede 18→20, body 16. Display tracking −0.03 em, line-height 1.04 |
| Hover transition | 100–200 ms with standard easing. Component transitions 200–300 ms. Reveals ≤400 ms. Never over 500 |
| Focus | 2 px outline, 2 px offset, `color.ring` |

## Anti-patterns (seen in the wild; avoid them)
- Consent overlays covering the hero or CTA on first paint.
- Autoplay or looping motion that ignores `prefers-reduced-motion`.
- Content that only exists after scroll-triggered JS (blank without JS, breaks print, keyboard and crawlers).
- Footnotes and legal text at 12 px across 160+ characters per line.
- Multi-sentence H1s. Two equally weighted filled CTAs.
- 28–30 px CTAs on touch layouts.
- Mega-menus with hundreds of links. Group them or move them to a sitemap page.
- Client-only rendering of primary content without a meaningful skeleton or fallback.
