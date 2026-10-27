import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

// Skeletons match final geometry (RE-05) and appear only after ~300ms so fast loads
// never flash a placeholder (RE-04, useDelayedFlag in lib/use-delayed-flag). The shimmer is static under reduced motion.
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn(
        'rounded-control bg-surface-sunken bg-[linear-gradient(90deg,transparent,oklch(from_var(--color-fg)_l_c_h/0.06),transparent)] bg-size-[200%_100%]',
        'motion-safe:animate-[wd-shimmer_1.6s_linear_infinite]',
        className,
      )}
      {...props}
    />
  )
}
