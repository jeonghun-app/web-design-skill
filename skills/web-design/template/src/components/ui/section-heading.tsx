import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Eyebrow → headline → lede: one focal point per section, keywords first (E5, TR-01).
export function SectionHeading({
  eyebrow, title, lede, align = 'center', className,
}: { eyebrow?: ReactNode; title: ReactNode; lede?: ReactNode; align?: 'center' | 'start'; className?: string }) {
  return (
    <div className={cn('max-w-3xl', align === 'center' ? 'mx-auto text-center' : '', className)}>
      {eyebrow && <p data-slot="eyebrow" className="text-sm font-semibold uppercase tracking-caps text-primary-text">{eyebrow}</p>}
      <h2 className="mt-3 text-h2">{title}</h2>
      {lede && <p className={cn('mt-4 text-lede text-fg-muted', align === 'center' && 'mx-auto', 'prose-measure')}>{lede}</p>}
    </div>
  )
}
