import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

// Tooltips supplement, never carry essential info (MO-10). Opens on hover after a short
// intent delay and on keyboard focus; Esc dismisses; hoverable (MO-08, MO-09).
export const TooltipProvider = ({ children }: { children: ReactNode }) => (
  <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={300}>{children}</TooltipPrimitive.Provider>
)

export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-(--layer-tooltip) max-w-xs rounded-control bg-fg px-2.5 py-1.5 text-xs text-bg shadow-raised data-[state=delayed-open]:animate-[wd-fade-in_var(--motion-duration-micro)_var(--ease-out)]"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
