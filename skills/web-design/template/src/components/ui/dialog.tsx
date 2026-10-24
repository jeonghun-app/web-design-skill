import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Radix gives focus trap, Esc, focus return and aria wiring (FK-04).
// Enter = ease-out over motion.duration.large; exit is shorter with ease-in (MT-01, MT-02).
export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

const contentVariants = cva(
  [
    'fixed z-(--layer-modal) surface shadow-overlay focus-visible:outline-none',
    'data-[state=open]:animate-[wd-pop-in_var(--motion-duration-large)_var(--ease-out)]',
    'data-[state=closed]:animate-[wd-pop-out_var(--motion-duration-small)_var(--ease-in)]',
    'data-[state=closed]:pointer-events-none', // MC-03: an exiting dialog never swallows clicks
  ],
  {
    variants: {
      side: {
        center: 'left-1/2 top-1/2 max-h-[85dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-panel p-6',
        right: 'inset-y-0 right-0 h-full w-[min(100%,26rem)] overflow-y-auto rounded-none border-y-0 border-r-0 p-6 data-[state=open]:animate-[wd-slide-in-right_var(--motion-duration-large)_var(--ease-out)] data-[state=closed]:animate-[wd-slide-out-right_var(--motion-duration-small)_var(--ease-in)]',
        left: 'inset-y-0 left-0 h-full w-[min(85%,20rem)] overflow-y-auto rounded-none border-y-0 border-l-0 p-4 data-[state=open]:animate-[wd-slide-in-left_var(--motion-duration-large)_var(--ease-out)] data-[state=closed]:animate-[wd-slide-out-left_var(--motion-duration-small)_var(--ease-in)]',
      },
      size: { sm: 'max-w-[25rem]', md: 'max-w-[37.5rem]', lg: 'max-w-[50rem]' },
    },
    compoundVariants: [{ side: ['left', 'right'], size: ['sm', 'md', 'lg'], class: 'max-w-none' }],
    defaultVariants: { side: 'center', size: 'md' },
  },
)

export function DialogContent({
  className, side, size, title, description, children, ...props
}: ComponentProps<typeof DialogPrimitive.Content> & VariantProps<typeof contentVariants> & { title: ReactNode; description?: ReactNode }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-(--layer-modal) bg-overlay data-[state=closed]:pointer-events-none data-[state=open]:animate-[wd-fade-in_var(--motion-duration-large)_var(--ease-out)] data-[state=closed]:animate-[wd-fade-out_var(--motion-duration-small)_var(--ease-in)]" />
      <DialogPrimitive.Content
        data-slot="dialog"
        {...(description ? {} : { 'aria-describedby': undefined })}
        className={cn(contentVariants({ side, size }), className)}
        {...props}
      >
        <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
        {description && <DialogPrimitive.Description className="mt-1 text-sm text-fg-muted">{description}</DialogPrimitive.Description>}
        <div className="mt-5">{children}</div>
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute right-3 top-3 grid size-11 place-items-center rounded-control text-fg-muted hover:bg-surface-sunken hover:text-fg"
        >
          <svg viewBox="0 0 16 16" aria-hidden className="size-4 fill-current"><path d="M3.7 2.6 8 6.9l4.3-4.3 1.1 1.1L9.1 8l4.3 4.3-1.1 1.1L8 9.1l-4.3 4.3-1.1-1.1L6.9 8 2.6 3.7z" /></svg>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/** Footer: secondary left of primary; destructive actions name the object (FE-03). */
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}
