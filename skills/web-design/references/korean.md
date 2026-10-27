# Korean-first (and CJK) web UI

Use this file whenever the audience reads Korean, or Japanese or Chinese. Setting `<html lang="ko">` turns on the template's Korean rules: `new-project.mjs --lang ko` sets it for you. The base CSS then switches line breaking and the text measure automatically. These values come from measuring Hangul fonts and from public standards: the government design system (KRDS), KWCAG 2.2, and the W3C Korean and Japanese layout requirements.

## Measured facts
- **Hangul is wide.** In common Korean UI fonts a syllable is about 0.86–0.92em wide. Korean running text averages about 0.72em per character including spaces, while Latin averages about 0.47em, so Korean takes about 1.5× the width. A line that holds 66 Latin characters holds about 43 Korean ones.
- **Vertical metrics differ between fonts.** Pretendard's content area is about 1.19em and its metrics are symmetric, so labels center cleanly in fixed-height controls. Noto Sans KR's content area is about 1.45em and sits visibly off-center unless you override its metrics (KO-11).
- **Full Korean fonts are huge.** A complete Korean variable font is about 2 MB, and a single static weight is about 0.8 MB. Always ship dynamic subsets (`unicode-range` slices of about 25–40 KB). Browsers then download only the glyphs a page uses.

## Typography rules

| ID | Rule | Value or code |
|---|---|---|
| KO-01 | **Break lines between words (어절), never inside one**, but let long URLs and IDs wrap | `:lang(ko) { word-break: keep-all; overflow-wrap: break-word; line-break: strict }` (in the template's base CSS). Use `break-word`, **not** `anywhere`: `anywhere` lowers the min-content width, so flex items and table cells shrink and split words syllable by syllable. Use `.break-all` for codes and URLs. Check: no word splits at 320 px and no horizontal overflow (LA-08). |
| KO-02 | Headings use `text-wrap: balance`, which works fine for Korean. `pretty` is progressive enhancement only. | in the template's base CSS |
| KO-03 | **Body ≥16 px.** 17 px is common with narrower Hangul faces such as Pretendard, and is the public-service default. | `text.base` 1rem, or 1.0625rem in `civic-clear` |
| KO-04 | **Line-height:** body ≥1.5; long reading 1.6–1.7; compact UI labels 1.35–1.4; headings 1.25–1.35 | `text.*--line-height` |
| KO-05 | **Tracking by size.** About 0 at 16–17 px. Negative only at display and heading sizes (≥20 px), and never tighter than −0.035em. Small captions may go slightly positive (+0.01em). "Korean always needs heavy negative tracking" is a portal-era habit: modern systems use 0 for body text. | `tracking.*`; packs may tighten display text only |
| KO-06 | **Measure: 30–45 Hangul characters per line**, which is about `32em`. Japanese and Chinese: ≤40 characters (`40em`). | `layout.prose-ko`; `:lang(ko)` swaps `--layout-prose` automatically. The audit's TY-02 limit is 45 for Hangul and 40 for ja/zh. |
| KO-07 | **Emphasis with weight or color, never italics.** Slanted Hangul or CJK is just distorted. Underline is for links only. | `:lang(ko) em { font-style: normal; font-weight: … }` in the base CSS |
| KO-08 | **Numbers:** prices, tables, timers and OTP fields use `tabular-nums`. Pretendard's digits are proportional by default. | `tabular-nums` utility (the data table does this) |
| KO-09 | **Font stack** ends with the platform Korean fonts. Either system-first, or brand-first with Pretendard. | `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif` |
| KO-10 | **Font loading:** dynamic subset with `font-display: swap`. Never ship a full Korean font file. Korean font bytes on first load stay ≤300 KB. | the template loads the Pretendard dynamic subset (`web-design.config.json` → `fonts`) |
| KO-11 | **Mixing a Latin face:** load it first with `unicode-range: U+0000-00FF, U+2000-206F`. Keep cap height and x-height within ~5% of the Korean face, or adjust with `size-adjust`. In fixed-height boxes, avoid faces with tall line metrics, or override them (`ascent-override` / `descent-override`). | n/a |
| KO-12 | **Figma ↔ CSS:** set Figma's vertical trim to "Standard" so text boxes match the CSS line-height. Check for 1 px drift in screenshots. | n/a |
| KO-13 | Use rem units and respect OS/browser text scaling (TY-05). An in-page text-size control (90–150%) is a common public-service courtesy. | n/a |

**Japanese and Chinese specifics**
- No extra tracking on kana or kanji. Negative tracking is a Korean habit.
- With more than ~35 characters per line, use a line-height of about 1.8–2.0.
- `keep-all` does nothing for Japanese, which has no spaces. Use `line-break: strict`, plus `word-break: auto-phrase` in Chromium.
- Emphasis uses weight, color or `text-emphasis` dots.
- Use `text-autospace` where supported to add space between CJK and Latin text.

## Color and controls (public-service grade)
- **Check brand colors before using them as text.** Bright oranges and mid blues often fail 4.5:1 on white. Use `primary-text` for brand-colored text and keep the raw brand color for fills (`visual-craft.md`).
- **High-contrast mode** for public services: body text 15:1; headings, labels and icons 7:1.
- **Accent color** covers ≤5% of the screen. Disabled states don't rely on transparency alone. Status always pairs color with an icon and text (CO-04).
- **Controls:**
  - Default height 48 px; scale 40 / 48 / 56.
  - Touch targets ≥44×44 px.
  - Focus ring clearly visible (`civic-clear` uses 3 px with a 3 px offset).

## Forms and flows (Korean conventions)

| Field / flow | Pattern |
|---|---|
| **Name (이름)** | One field, not separate family and given names. Allow any characters, spaces and hyphens. Never require ≥3 characters, since many names are 2–3 syllables. `autocomplete="name"`. |
| **Date of birth** | No date picker. One field with a format hint, or three numeric fields. Display dates as `2026. 10. 24.` or `2026년 10월 24일 (토)` (`formatDateKo`). |
| **Gender** | No preselection. Offer "선택 안 함" (prefer not to say) when the information isn't strictly required. |
| **Phone** | Label it "휴대 전화번호" when it must be a mobile number. Accept spaces and hyphens and format as `010-1234-5678` (`formatPhoneKo`). `inputmode="tel"`, `autocomplete="tel-national"`. |
| **Money** | `12,900원` in UI copy (`formatWon`). `₩12,900` in tables or international contexts. Compact amounts as `1.5억` (`formatCompactKo`). Never write "대한민국 원". |
| **Address (도로명 주소)** | Read-only postcode field and a [주소 검색] (address search) button, then the postcode service's result (5-digit postcode plus road or lot address), then *your own* detail-address field (상세주소). Focus moves to that field after selection, and the reference item (참고항목) is appended in parentheses. On mobile and in webviews, embed the search inline, not in a popup or fixed layer. |
| **Identity verification (본인인증)** | Let people choose a method: mobile carrier (name, birth date, carrier, number, SMS code) or a simple-auth app (간편인증). It usually redirects on mobile, so persist form state before leaving. After verification, prefill name and birth date and lock them. |
| **Login** | Show-password toggle and paste allowed. Don't split equal login methods into tabs. Warn ≥20 s before a session timeout with [시간 연장] (extend) and [로그아웃] (log out). Login prompts in modals include a "로그인 안 함" (don't log in) option. Social login buttons follow the providers' brand rules: for Kakao, a `#FEE500` background, the black symbol, and the label "카카오 로그인". |
| **Consent (약관 동의)** | A "전체 동의" (agree to all) master checkbox, then each item marked **[필수]** (required) or **[선택]** (optional), with required items first. Each item has its own control and a 약관 보기 (view terms) link. Declining optional items never blocks the service. Marketing consent is separate and unticked (ON-06, DP-02). ⚠ Re-check the current Personal Information Protection Act (PIPA) consent display rules (amended 2023) before shipping. |
| **Payment (간편결제)** | Show the wallets this market expects (토스페이, 카카오페이, 네이버페이, …) as equal, large tiles above card entry, and remember the last one used (EC-17). |
| **Form layout** | Single column. Related fields may sit in one row (postcode + search, start and end date). Modals hold ≤5 fields. On a server error, focus moves to the first invalid field. Submit shows a pending state (RE-07). |

## Writing
Write in the 해요체, in the active voice, phrased positively, with [닫기] (close) as the secondary dialog button. The full list is in `content.md`, K-01 to K-12.

## Accessibility and law
- **Korean web accessibility certification** checks **KWCAG 2.2**: 33 items in four groups (perceivable, operable, understandable, robust). It has no A/AA levels and is scored as the percentage of pages that conform.
- **Items new in 2.2**, all already covered by our rules:
  - character key shortcuts
  - fixed reference locations
  - pointer input support and pointer cancellation (MO-11)
  - label in name
  - motion actuation
  - findable help
  - accessible authentication (CG-08)
  - redundant entry (CG-08)
- **KWCAG doesn't list some WCAG 2.2 AA criteria separately**: reflow, text spacing, non-text contrast, focus not obscured, target size and status messages. **Test them anyway.** `audit.mjs` covers reflow (LA-08), text spacing (TY-04), focus (FK-01, FK-03) and target size (MO-01).
- **Legal basis:** the Disability Discrimination Act (장애인차별금지법) and the Framework Act on Intelligent Informatization (지능정보화기본법) require accessibility.
- **Dark-pattern rules** under the E-Commerce Act (전자상거래법) are in force. See DP-01 to DP-10 in `conversion.md`.

## Myths to drop
- **"Korean UI always needs strong negative tracking."** Only headings ≥20 px need it. Body text sits at about 0.
- **"Hangul needs line-height 1.7+."** 1.5 is the standard for UI. 1.6–1.7 is for long-form reading.
- **"45–75 characters per line."** That is the Latin rule. Hangul needs 30–45.
- **"`keep-all` is enough."** Without `overflow-wrap: break-word`, long Latin strings and URLs overflow. `overflow-wrap: anywhere` overcorrects and splits Korean words in tight flex and table boxes.
