'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

export type Command = { id: string; label: string; group: string; hint?: string; run: () => void }

// ⌘K / Ctrl+K palette: recognition over recall for expert users (CG-04). Combobox +
// listbox semantics with aria-activedescendant; arrows move, Enter runs, Esc closes.
export function CommandPalette({ commands, open, onOpenChange }: { commands: Command[]; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listId = useId()
  // Opened by shortcut or a plain button, so remember where focus was and return it (OVL-02).
  const returnFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (open) returnFocus.current = document.activeElement as HTMLElement | null
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? commands.filter((c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)) : commands
  }, [commands, query])
  useEffect(() => setActive(0), [query, open])

  const groups = [...new Set(results.map((r) => r.group))]
  const run = (c: Command | undefined) => {
    if (!c) return
    onOpenChange(false)
    setQuery('')
    c.run()
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-(--layer-modal) bg-overlay data-[state=closed]:pointer-events-none! data-[state=open]:animate-[wd-fade-in_var(--motion-duration-small)_var(--ease-out)]" />
        <DialogPrimitive.Content
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            returnFocus.current?.focus?.()
          }}
          aria-label="Command palette"
          className="fixed left-1/2 top-[12dvh] z-(--layer-modal) w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden surface rounded-panel shadow-overlay data-[state=open]:animate-[wd-pop-in_var(--motion-duration-small)_var(--ease-out)]"
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Type to filter commands, use arrow keys to choose and Enter to run.</DialogPrimitive.Description>
          <input
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${results[active].id}` : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
              if (e.key === 'Enter') { e.preventDefault(); run(results[active]) }
            }}
            placeholder="Search commands…"
            aria-label="Search commands"
            className="h-14 w-full border-b border-border bg-transparent px-5 text-base outline-none placeholder:text-fg-subtle focus-visible:shadow-[inset_0_-2px_0_var(--color-ring)]"
          />
          <ul id={listId} role="listbox" aria-label="Commands" className="max-h-80 overflow-y-auto p-2">
            {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-fg-muted">No commands match “{query}”.</li>}
            {groups.map((g) => (
              <li key={g} role="presentation">
                <p className="px-3 pb-1 pt-2 text-xs font-medium text-fg-muted">{g}</p>
                <ul role="group" aria-label={g}>
                  {results.filter((r) => r.group === g).map((c) => {
                    const i = results.indexOf(c)
                    return (
                      <li
                        key={c.id}
                        id={`${listId}-${c.id}`}
                        role="option"
                        aria-selected={i === active}
                        onMouseMove={() => setActive(i)}
                        onClick={() => run(c)}
                        className={cn('flex min-h-10 cursor-pointer items-center justify-between rounded-control px-3 text-sm', i === active && 'bg-surface-sunken')}
                      >
                        {c.label}
                        {c.hint && <kbd className="font-mono text-xs text-fg-muted">{c.hint}</kbd>}
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
