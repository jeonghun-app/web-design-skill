// Korean display formats (korean.md, content.md K-12). Intl does most of it; these
// helpers pin the conventions people expect in Korean UI copy.

/** 1234567 → "1,234,567원" (UI copy). Use formatKrwSymbol for tables. */
export const formatWon = (n: number) => `${new Intl.NumberFormat('ko-KR').format(n)}원`

/** 1234567 → "₩1,234,567" */
export const formatKrwSymbol = (n: number) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(n)

/** 152000000 → "1.5억" (compact amounts in cards and charts) */
export const formatCompactKo = (n: number) => new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

/** Date → "2026. 10. 24." (default) or "2026년 10월 24일 (토)" (long) */
export const formatDateKo = (d: Date, style: 'short' | 'long' = 'short') =>
  style === 'short'
    ? new Intl.DateTimeFormat('ko-KR').format(d)
    : `${new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(d)} (${new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(d)})`

/** Date → "오후 2:30" or, with h23, "14:30" */
export const formatTimeKo = (d: Date, hour12 = true) =>
  new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit', ...(hour12 ? {} : { hourCycle: 'h23' as const }) }).format(d)

/** Accepts any spacing/hyphens and returns "010-1234-5678" / "02-123-4567"; leaves unknown shapes as typed. */
export function formatPhoneKo(input: string) {
  const d = input.replace(/\D/g, '')
  if (/^02\d{7,8}$/.test(d)) return d.replace(/^(02)(\d{3,4})(\d{4})$/, '$1-$2-$3')
  if (/^01\d{8,9}$/.test(d) || /^0\d{9,10}$/.test(d)) return d.replace(/^(0\d{2})(\d{3,4})(\d{4})$/, '$1-$2-$3')
  return input
}
