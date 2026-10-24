import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Visible label above the input, hint and error linked with aria-describedby (CG-04, FE-01).
export function Field({
  label, hint, error, className, inputClassName, ...props
}: ComponentProps<'input'> & { label: ReactNode; hint?: ReactNode; error?: ReactNode; inputClassName?: string }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <div data-slot="field" className={cn('grid gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={cn(
          'h-(--size-control-md) w-full rounded-control border-(length:--effect-border-width) border-border-strong bg-surface px-3',
          'text-base sm:text-sm placeholder:text-fg-subtle',
          'transition-[border-color,box-shadow] duration-(--motion-duration-micro)',
          'focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring',
          'aria-invalid:border-danger',
          inputClassName,
        )}
        {...props}
      />
      {hint && <p id={hintId} className="text-sm text-fg-muted">{hint}</p>}
      {error && (
        <p id={errorId} className="flex items-center gap-1.5 text-sm text-danger">
          <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-current"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.5h1.5v5h-1.5v-5Zm0 6.25h1.5v1.5h-1.5v-1.5Z" /></svg>
          {error}
        </p>
      )}
    </div>
  )
}
