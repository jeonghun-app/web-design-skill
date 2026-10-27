'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

// Logo top-left links home, primary nav at top, one CTA at the right (LA-07, prototypicality).
export function Nav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false)
  return (
    <header data-slot="nav" className="chrome sticky top-0 z-(--layer-sticky) border-b border-border">
      <nav aria-label="Main" className="container-page flex h-(--layout-nav-h) items-center gap-6">
        <a href="/" className="flex min-h-11 items-center gap-2 font-semibold">
          <span aria-hidden className="grid size-7 place-items-center rounded-control bg-primary text-primary-fg">◆</span>
          Lumen
        </a>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="inline-flex min-h-11 items-center rounded-control px-3 text-sm text-fg-muted transition-colors duration-(--motion-duration-micro) hover:text-fg">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" tone="neutral" size="sm" className="hidden sm:inline-flex">Sign in</Button>
          <Button size="sm">Start free</Button>
          <Button variant="ghost" tone="neutral" size="icon" className="md:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label="Menu" onClick={() => setOpen(!open)}>
            <svg viewBox="0 0 20 20" aria-hidden className="fill-current"><path d="M3 5h14v1.5H3zM3 9.25h14v1.5H3zM3 13.5h14V15H3z" /></svg>
          </Button>
        </div>
      </nav>
      {open && (
        <ul id="mobile-nav" className="container-page grid gap-1 pb-4 md:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="flex min-h-12 items-center rounded-control px-3 hover:bg-surface-sunken">{l.label}</a>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}
