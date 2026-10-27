# Conversion, commerce and honest persuasion

Use this file for landing pages, pricing, product lists and detail pages, cart, checkout and signup. Each rule has an evidence label:
- **strong**: a large usability benchmark, a controlled experiment, a meta-analysis or binding law
- **moderate**: one solid study, eye-tracking, or large observational data
- **weak**: a vendor claim, a survey, or inference from neighboring evidence

Weak rules are defaults, not laws. Rules marked ⚠ need a fresh check before you cite them to a client.

## Read this first: how to treat "conversion wins"
- **Most ideas fail.** At organizations that test seriously, the majority of A/B ideas don't improve anything, but blogs publish only the winners. Treat any lift above about 20% from a single page change as a probable bug until it is replicated (CV-11).
- **Choice overload is mostly a myth.** On average, more options don't reduce choice. Highlight a recommended option to make choosing easy instead of cutting options blindly.
- **Decoy plans don't hold up.** The famous decoy-pricing demo largely disappears with realistic stimuli. Highlight a real plan. Never add a fake one.
- **Button color alone doesn't transfer between sites.** Contrast and salience do (LA-01).
- **Abandonment is not all UX.** Many people abandoning a cart were "just browsing". Fix the reasons you can address: extra costs, forced accounts, long or failing forms, slow or unknown delivery, and distrust of the card form.

## CV: landing and pricing

| ID | Rule | Evidence |
|---|---|---|
| CV-01 | The headline states what it is, for whom, and the outcome. H1 ≤10 words, subhead ≤25 words. H1, subhead and primary CTA all sit in the first viewport (LA-04). | moderate (attention concentrates in the first 1–2 screens) |
| CV-02 | One primary action per page, repeated about every two screens and at the end. At most one secondary action in the hero. Labels are verb + object ("Start free trial", not "Submit" or "Learn more"). | weak |
| CV-03 | Social proof is specific and checkable: 5–8 real customer logos; ≥3 testimonials with name, role and company; ratings always shown with their count. Never show tiny or invented numbers. | moderate |
| CV-04 | Put proof next to the claim or decision it supports, not only in a separate testimonials block. | weak |
| CV-05 | Treat speed as a conversion feature. p75 mobile field data: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1. Controlled tests have tied faster LCP to more sales. | strong |
| CV-06 | 5–8 FAQ items covering the real objections (price, cancelling, data, setup, support), placed before the final CTA. | weak |
| CV-07 | Risk reversal sits right next to the CTA ("No card required", "Cancel anytime", "30-day returns"), and only if it is true. | weak (indirect: trust and returns drive abandonment) |
| CV-08 | Pricing: 3–4 plans, one honestly recommended plan highlighted. The comparison matrix is grouped into ≤6 categories with a sticky plan header. | moderate |
| CV-09 | The annual/monthly toggle always shows the billing period and the yearly total. Never show only the per-month figure of an annual price. | moderate, and regulatory |
| CV-10 | Free trials show their end date and send a reminder before the first charge. A free plan turning paid needs consent and advance notice (DP-06). | strong (regulatory) |
| CV-11 | A lift above 20% from one change is suspect until replicated. | strong |

## EC: e-commerce

| ID | Rule | Evidence |
|---|---|---|
| EC-01 | Product lists offer the essential filter types, always including **price** and **rating**. Most mobile shoppers use the price filter. | strong |
| EC-02 | Filters: multi-select (OR) within a type, combined (AND) across types, using checkboxes. Applied filters show as removable chips with "Clear all". People routinely apply 5–6 filters. | strong |
| EC-03 | Desktop lists load 50–150 items at a time (visual products 100–150, spec-driven ones 50–100), with "Load more" and "Showing 48 of 312". | moderate |
| EC-04 | Default sort is relevance or best-selling with breadth: every product type over ~10% of the list appears in the first 20. Sorting by rating weighs the rating count, since most people prefer 4.5★ from 12 ratings over 5★ from 2. | strong |
| EC-05 | List cards show ≥3 images, a unit price where pack sizes vary, the rating with its count, attributes in a consistent order, and color or size variants merged into one card with swatches. | strong |
| EC-06 | Product gallery: high-resolution and zoomable, with thumbnails on mobile too. Include at least one in-scale image and one lifestyle image. Many shoppers start with the images and judge size from them. | strong |
| EC-07 | Buy box: discounts grouped with the price, sizes as buttons rather than a dropdown, and shipping cost plus delivery date on the page. Most shoppers look for shipping cost there. | strong |
| EC-08 | Show a delivery **date** ("Arrives Thu 30 Oct"), not a speed ("3–5 business days"). | strong |
| EC-09 | Reviews: a clickable rating histogram that filters the list. Negative reviews stay easy to find, and most shoppers look for them. | strong |
| EC-10 | Cart: show the full total (shipping and tax estimates) before checkout. The coupon field sits behind a link. Cross-sells are compatible items only, one row at most. | strong |
| EC-11 | Cart drawer or cart page are both fine. A drawer confirms the add, shows the subtotal and offers Checkout and View cart. Keep a full page for editing. | weak |
| EC-12 | **Guest checkout is the most prominent option.** Offer account creation on the confirmation page. | strong |
| EC-13 | ≤8 fields by default. Use one "Full name" field. Hide address line 2, company and coupon behind links. Billing address = shipping address by default. | strong |
| EC-14 | Single column, labels above the fields (FE-04). Mark required *and* optional fields. | strong |
| EC-15 | Validate on blur, then live once a field is invalid (FE-01). Errors name the specific cause. Never clear card details after an error. | strong |
| EC-16 | Address lookup with a manual fallback; the postal code fills city and region. Hand-typed addresses often contain typos. | strong |
| EC-17 | Card plus at least one wallet or local method. In Korea that means 카카오페이, 네이버페이, 토스페이 and the like (see `korean.md`). Express buttons go at the top of checkout and in the cart. | moderate |
| EC-18 | Visually reinforce the card fields: a framed panel, a lock icon, payment logos (TR-04). | moderate |
| EC-19 | Show a progress indicator with step names (RE-09). Accordion checkouts collapse finished steps into editable summaries and still have a review step. | moderate |
| EC-20 | The confirmation page is not a dead end. Show the order number, delivery date, what happens next, a password-only account offer, and print or save. | moderate |
| EC-21 | Mobile: a sticky add-to-cart bar once the buy box scrolls away. Targets ≥48 px. It must never cover content or consent controls (MO-05). | weak |

## ON: signup and onboarding

| ID | Rule | Evidence |
|---|---|---|
| ON-01 | Signup asks for ≤3 fields. Ask for profile data later, when a feature needs it. | moderate |
| ON-02 | Passwords: allow ≥64 characters, paste, password managers and a show-password toggle. No forced character mixes, no forced rotation. Block known-breached passwords. Minimum 8 characters with MFA, 15 for password-only accounts. | strong |
| ON-03 | Passkeys, magic links and social login are alternatives, never the only path. Always keep an email path. | weak |
| ON-04 | Let people in before email verification, and verify at the risky moment (payment, sharing). Confirm the email address rather than asking for the password twice. | weak |
| ON-05 | Long or branching flows use one question per page. Eligibility questions come first. End with a check-your-answers page. | strong |
| ON-06 | Marketing consent is a separate, unticked checkbox. | strong |

## DP: dark patterns (binding in Korea, the EU and the US)

**Korea**
- The amended 전자상거래법 has been in force since 2025-02-14. It regulates six patterns:
  - 숨은 갱신 (hidden renewal)
  - 순차공개 가격책정 (drip pricing)
  - 특정옵션 사전선택 (pre-selected options)
  - 잘못된 계층구조 (false hierarchy)
  - 취소·탈퇴 방해 (blocking cancellation or account deletion)
  - 반복간섭 (repeated nagging)
- The 2026-10 KFTC guideline 「다크패턴 방지를 위한 온라인 인터페이스 운영 가이드라인」 consolidates guidance into 13 types, with examples.

**EU**
- The DSA (Art. 25) bans deceptive interfaces on online platforms.
- Data-protection authorities require Reject to be as easy as Accept.

**US**
- FTC enforcement covers fake timers, junk and drip fees, and hard cancellation. ⚠ The federal click-to-cancel rule's status changed in 2025, so check state rules.

| ID | Rule |
|---|---|
| DP-01 | **No drip pricing.** The first price shown includes every mandatory fee, including shipping when it is unavoidable. |
| DP-02 | **No pre-selected** paid add-ons, insurance, donations or consent boxes. |
| DP-03 | **No false hierarchy.** Decline/Reject has the same size and level as Accept, and its text meets ≥4.5:1 (CO-01). |
| DP-04 | **Cancellation and account deletion** are on the first screen after login or one click from it (for example My page). They are never buried under "Edit profile" or "Security". Cancelling takes no more steps than signing up. |
| DP-05 | **No nagging after a refusal.** Offer "don't ask again". ⚠ Re-prompt intervals (such as 7 days) need checking against current guidance. |
| DP-06 | **Subscriptions** need consent plus advance notice before a free plan turns paid or a price rises. Show the renewal date and price in the account. |
| DP-07 | **Real urgency only.** Timers that end and don't reset; true stock counts; no fake "X people viewing". |
| DP-08 | **No confirmshaming** ("No thanks, I hate saving money"). Decline labels are neutral ("No thanks"). |
| DP-09 | **Cookie banners.** Accept and Reject sit on the first layer with equal weight. No pre-ticked purposes. Nothing is mislabeled "essential". A persistent link lets people change their consent. Scrolling is not consent. The banner never covers the hero CTA on first paint. Use a bottom bar (patterns.md anti-patterns). |
| DP-10 | Don't hide negative reviews. Label incentivized reviews. |

## Blueprints (section order with measurements)

### Landing
1. Header, 64–72 px: logo, ≤5 links, 1 CTA.
2. Hero, first viewport: H1 ≤10 words, subhead ≤25 words, primary CTA plus ≤1 secondary, risk-reversal line under the CTA, product visual.
3. Logo bar: 5–8 logos, 24–32 px tall.
4. Benefits: 3 cards, each with a 4–6 word title and ≤2 lines of text, or a bento grid (patterns.md).
5. Product demo with 2–3 callouts.
6. 3 attributed testimonials, or one case study with a real number.
7. Metrics: 3–4 sourced numbers.
8. How it works (3 steps), or a pricing teaser.
9. FAQ: 5–8 items.
10. Final CTA band.
11. Footer: privacy, cookie settings, help and cancellation links.

### Pricing
1. H1.
2. Monthly/annual toggle: "billed annually", the yearly total, the saving.
3. 3–4 equal-width plan cards. One recommended plan with badge and ring. Each card has price and period, who it's for, CTA, and 5–7 features.
4. Risk-reversal row, only if true.
5. Proof strip.
6. Comparison matrix: ≤6 groups, sticky header, tooltips for jargon.
7. Enterprise/contact row.
8. FAQ: 6–10 items on billing, cancelling, refunds and data.
9. Final CTA.

### Product list (PLP)
1. Breadcrumb, H1 and result count.
2. Filters.
   - Desktop: a 240–280 px sidebar with checkboxes and search inside long option lists.
   - Mobile: a sticky "Filter & sort" bar opens a full-screen sheet with a "Show N results" button.
3. Applied-filter chips with "Clear all".
4. Sort control.
5. Grid: 4 columns from 1280 px, 3 below that, 2 on mobile.
6. Card: 1:1 or 4:5 image (≥3 alternates), 2-line title, price plus unit price, rating with count, swatches.
7. 50–150 items per load with "Load more".
8. A helpful no-results state: what was searched, what to change, popular categories.

### Product page (PDP)
1. Breadcrumb.
2. Desktop layout: gallery 55–60% (thumbnails, zoom, in-scale, lifestyle, video) beside a 40% buy box.
3. Buy box:
   - title
   - rating with count, linking to reviews
   - price, with any discount grouped beside it
   - variant buttons or swatches, plus a size-guide link
   - quantity
   - Add to cart, full width, ≥48 px; optional express wallet
   - delivery date and shipping cost
   - returns line
   - honest stock status
4. 3–6 highlights.
5. Description and specs table.
6. Reviews: clickable histogram, filters, photos, negatives visible.
7. Compatible accessories and similar items.
8. Mobile: swipeable gallery with a counter, and a sticky add-to-cart bar after the buy box scrolls away.

### Cart
1. H1 "Cart (N)".
2. Line items: image, variant, quantity that updates automatically, remove, save for later.
3. Summary panel, sticky on desktop:
   - subtotal
   - shipping estimate, or a postal-code calculator
   - tax and fees
   - total
   - collapsed coupon link
   - Checkout and express wallets
4. Delivery date, and a free-shipping progress bar with true numbers.
5. Returns line.
6. ≤1 row of relevant cross-sells.

### Checkout
1. Minimal header: logo, secure indicator, help. No main navigation.
2. Express wallets at the top.
3. Account step with guest checkout most prominent.
4. Email.
5. Shipping:
   - full name
   - address lookup with manual fallback; the postal code fills city and region
   - phone, with a note on why it's needed
   - "billing = shipping" ticked
6. Delivery options with dates and prices.
7. Payment: method selector and a reinforced card panel. The card is kept on error.
8. Review step.
9. Place order, stating the total ("Pay $84.20").

Throughout: progress with step names, a single column, ≤8 fields, validation on blur, specific errors, marketing consent unticked.

### Order confirmation
1. Success heading and order number.
2. Delivery date, address, items, total, payment method.
3. "We emailed you a receipt".
4. What happens next, plus tracking.
5. Optional password-only account creation.
6. Print/save, help, returns.

### Signup
1. H1 stating the benefit.
2. Email, then passkey, magic link or password.
3. SSO buttons labeled by provider.
4. ≤3 fields, an unticked marketing consent box, a terms link.
5. Let people in and verify later.
6. Profile questions inside the product, one at a time and skippable.
7. Account deletion one click from the signed-in home (DP-04).
