import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

// Cards use the `surface` utility so trend packs restyle them through tokens only.
export function Card({ className, interactive, ...props }: ComponentProps<'div'> & { interactive?: boolean }) {
  return (
    <div
      data-slot="card"
      className={cn(
        'surface rounded-card p-6',
        interactive &&
          'cursor-pointer transition-[transform,box-shadow] duration-(--motion-duration-small) ease-(--ease-out) hover:translate-y-(--effect-card-hover-lift) hover:shadow-raised',
        className,
      )}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return <h3 data-slot="card-title" className={cn('text-h3 font-[number:var(--font-weight-heading)]', className)} {...props} />
}

export function CardText({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="card-text" className={cn('mt-2 text-fg-muted', className)} {...props} />
}
