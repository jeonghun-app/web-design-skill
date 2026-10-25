import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Usage guidance card: example on top, verdict caption below with a 4px top rule,
// icon + word (never color alone, CO-04). 2-up grid with a 16px gap in docs.
const TONES = {
  do: { label: 'Do', rule: 'border-success', tint: 'bg-success/10', icon: 'M3.5 8.5 6.5 11.5 12.5 4.5' },
  dont: { label: "Don't", rule: 'border-danger', tint: 'bg-danger/10', icon: 'M4 4l8 8M12 4l-8 8' },
  caution: { label: 'Caution', rule: 'border-warning', tint: 'bg-warning/15', icon: 'M8 4v5M8 11.5v.5' },
} as const

export function DoDont({ tone, children, caption }: { tone: keyof typeof TONES; children: ReactNode; caption: ReactNode }) {
  const t = TONES[tone]
  return (
    <figure data-slot="do-dont" data-tone={tone} className="overflow-hidden rounded-card border border-border bg-surface">
      <div data-audit-specimen className="grid min-h-40 place-items-center bg-surface-sunken p-6">{children}</div>
      <figcaption className={cn('border-t-4 p-4', t.rule, t.tint)}>
        <span className="flex items-center gap-2 font-semibold">
          <svg viewBox="0 0 16 16" aria-hidden className="size-4 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"><path d={t.icon} /></svg>
          {t.label}
        </span>
        <span className="mt-1 block text-fg-muted">{caption}</span>
      </figcaption>
    </figure>
  )
}
