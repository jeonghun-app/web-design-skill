import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      brand: 'bg-primary-soft text-primary-soft-fg',
      neutral: 'bg-surface-sunken text-fg-muted border border-border',
      success: 'bg-success/12 text-fg [&>[data-dot]]:bg-success',
      danger: 'bg-danger/12 text-fg [&>[data-dot]]:bg-danger',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

export function Badge({ className, tone, dot, children, ...props }: ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span data-dot aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
