'use client'

import * as Menu from '@radix-ui/react-dropdown-menu'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Menus: typeahead, arrow keys, Esc (Radix). Items are full-width 36px+ rows (MO-06);
// destructive items sit last, separated, in danger tone (MO-05).
export const DropdownMenu = Menu.Root
export const DropdownMenuTrigger = Menu.Trigger

export function DropdownMenuContent({ className, ...props }: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        sideOffset={6}
        align="end"
        className={cn(
          'z-(--layer-popover) min-w-48 surface rounded-card p-1 shadow-overlay',
          'data-[state=open]:animate-[wd-pop-in_var(--motion-duration-small)_var(--ease-out)] data-[state=closed]:animate-[wd-pop-out_var(--motion-duration-micro)_var(--ease-in)]',
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  )
}

export function DropdownMenuItem({ className, tone, icon, children, ...props }: ComponentProps<typeof Menu.Item> & { tone?: 'danger'; icon?: ReactNode }) {
  return (
    <Menu.Item
      // design-lint-allow CL-04 Radix moves real focus onto the item and marks it data-highlighted (filled row), which is the indicator
      className={cn(
        'flex min-h-9 cursor-pointer select-none items-center gap-2 rounded-control px-2.5 text-sm outline-none',
        'data-[highlighted]:bg-surface-sunken data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        'pointer-coarse:min-h-11 [&_svg]:size-4',
        tone === 'danger' && 'text-danger data-[highlighted]:bg-danger/10',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </Menu.Item>
  )
}

export const DropdownMenuSeparator = () => <Menu.Separator className="my-1 h-px bg-border" />
export const DropdownMenuLabel = ({ children }: { children: ReactNode }) => (
  <Menu.Label className="px-2.5 py-1.5 text-xs font-medium text-fg-muted">{children}</Menu.Label>
)
