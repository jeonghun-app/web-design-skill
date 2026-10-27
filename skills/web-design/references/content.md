# Content and microcopy

Words are interface. A precise label beats a clever one, and copy is designed together with the layout, not poured in at the end. These rules apply in Figma and in code alike. Lorem ipsum never ships, and it shouldn't reach a design review either (R7 in `review.md`).

## Voice and tone
- **Voice stays constant** (who the product is). **Tone follows the reader's state**: lighter in onboarding, plain and calm in errors, payments and anything that touches money or data. Clarity beats humor every time.
- Aim for reading grade 7–8 (Korean: a middle-school level). Keep sentences under ~25 words and split longer ones.
- Address the reader directly ("you"; in Korean, use the 해요체 throughout). Use "we" only for the product's own actions.

## Rules (English)

| ID | Rule | Bad | Good |
|---|---|---|---|
| W-01 | Sentence case for headings, buttons, labels and menu items | Create New Project | Create new project |
| W-02 | Buttons are a verb + noun, 1–3 words, ≤20 characters. The label says what happens. | OK · Submit · Yes | Save changes · Delete file · Send invite |
| W-03 | Errors say **what happened, why, and how to fix it**. Title of 3–4 words, body of 1–2 sentences. | "Error 0x80: invalid input" | "Card declined. Your bank didn't approve this payment. Try another card." |
| W-04 | No blame and no "invalid" or "illegal". Don't invent a cause. Show the expected format instead. | "You entered an invalid date" | "Enter a date like 4 June 2026" |
| W-05 | Skip "please" and "sorry" unless the consequence is serious | "Sorry! Please try again" | "Couldn't save. Try again." |
| W-06 | Errors sit next to their field, as icon plus text, and keep what the user typed (FE-01, CO-04) | red banner at the top of the page | inline message under the field |
| W-07 | Empty states say what the area is, why it's empty, and offer one next action | "No data" | "No invoices yet. Create your first invoice to get paid." [Create invoice] |
| W-08 | Confirmations name the action and the object, and the destructive button repeats the verb (FE-03) | "Are you sure?" [Yes] [No] | "Delete 3 files? This can't be undone." [Delete files] [Cancel] |
| W-09 | Write numbers as numerals and dates unambiguously. Use "to" for ranges, thousands separators, and the % sign. | "2nd June, 10-11am" | "2 June, 10am to 11am" |
| W-10 | Page titles ≤65 characters, meta descriptions ≤160, headlines ≤8–10 words (CV-01) | n/a | n/a |
| W-11 | Links describe their destination. Say "select", not "click". Write "and", not "&". (CG-07) | "Click here" | "Download the 2026 report" |
| W-12 | Inclusive language: no gendered defaults, no ableist idioms, singular "they" | "Hey guys", "sanity check" | "Hi everyone", "quick check" |
| W-13 | Decline options are neutral, never shaming (DP-08) | "No thanks, I don't like saving money" | "No thanks" |
| W-14 | Loading and progress copy says what's happening and, after ~10 s, how long it will take (RE-04) | "Loading…" for 40 s | "Importing 1,240 contacts… about 30 seconds left" |

## Rules (Korean UI writing)

| ID | Rule | ✗ | ○ |
|---|---|---|---|
| K-01 | Use the 해요체 everywhere, in every context | 송금이 완료되었습니다 | 송금했어요 |
| K-02 | Prefer the active voice (되었어요 → 했어요) | 신청이 접수되었어요 | 신청했어요 |
| K-03 | Say it positively: replace "can't do it" with "you can do it once you…" | 인증 없이는 이용할 수 없어요 | 인증하면 바로 쓸 수 있어요 |
| K-04 | The secondary button in a dialog is [닫기], not [취소], so readers don't think their work is being cancelled. The primary button names the action. | [취소] [확인] | [닫기] [송금하기] |
| K-05 | Light honorifics: drop the -시- suffix, 계시다 → 있다, 여쭈다 → 묻다/확인하다 | 확인하시겠어요? | 확인할까요? |
| K-06 | Where dropping the honorific sounds awkward, make the needed information the subject | 직업이 어떻게 되세요? | 직업을 알려주세요 |
| K-07 | Don't stack nouns. Unpack Sino-Korean compounds into verbs. | 본인인증 진행 | 본인인지 확인할게요 |
| K-08 | Always contract 되어요 to 돼요 | 변경되어요 | 바뀌어요 |
| K-09 | When only a benefit is unavailable, say so positively so readers who scan don't think the whole service is blocked | 혜택을 받을 수 없어요 | 서비스는 그대로 쓸 수 있어요. 이번 혜택은 다음에 받을 수 있어요 |
| K-10 | Allowed exceptions: the passive voice for expiry, impact on the user (late payment, cancellation) and reassurance (privacy); honorific questions when guessing the user's situation or asking a favor; negative phrasing when policy blocks an action | n/a | n/a |
| K-11 | Never write guilt-tripping or pleading copy (다크패턴, DP-08) | "정말 혜택을 포기하시겠어요? 😢" | "혜택 없이 계속할까요?" |
| K-12 | Formats: dates `2026. 10. 24.` or `10월 24일 (금)`; money `12,900원`; phone numbers `010-1234-5678`; times `오후 3:00` (see `korean.md`) | n/a | n/a |

## Patterns

| Situation | Structure | Example (EN) | Example (KO) |
|---|---|---|---|
| Success toast | Past tense, what happened, plus Undo if reversible | "3 requests archived" [Undo] | "요청 3개를 보관했어요" [되돌리기] |
| Field hint | Format or example, ≤1 line | "We'll only use this for delivery updates." | "배송 알림에만 사용해요." |
| Destructive confirmation | Question naming the object, then the consequence, then [verb + object] / [Cancel] | "Delete project 'Atlas'? Its 24 files will be removed for everyone." | "'Atlas' 프로젝트를 삭제할까요? 파일 24개가 모두에게서 사라져요." [삭제하기] [닫기] |
| Empty state | What it is, why it's empty, one action | "No reports yet. Reports appear after your first week of data." | "아직 리포트가 없어요. 데이터가 일주일 쌓이면 보여드릴게요." |
| Permission ask | Benefit first, then the ask, then a way out | "Get notified when your order ships." [Turn on notifications] [Not now] | "주문이 출발하면 알려드릴게요." [알림 켜기] [나중에] |
| 404 | What happened, then 1–2 ways forward | "This page moved or never existed." [Go to home] [Search] | "페이지를 찾을 수 없어요." [홈으로] [검색하기] |

## Where copy meets layout
- **Write the real copy before the final layout.** Headline length drives the hero layout. A 4-word H1 and a 12-word H1 need different designs.
- Design for the **longest realistic string**: German expands about 30% over English, and Korean is shorter but taller. Test with pseudo-long strings in Figma and with the audit at 320 px (LA-08).
- **Front-load keywords** in headings, links and buttons (TY-08, CG-07). Readers scan the first 2–3 words.
- One idea per sentence and one action per button. If a label needs "and", it is two buttons or the wrong flow.
