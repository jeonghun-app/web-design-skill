'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Toasts confirm an outcome without blocking. Polite live region; at most 3 visible;
// auto-dismiss pauses while hovered or focused; actionable toasts (Undo) stay longer
// so there is time to reach the button (WCAG 2.2.1 timing, FE-03 undo pattern).
// No error tone on purpose: errors belong inline, next to their cause (FB-01).
type Toast = { id: number; title: string; description?: string; tone?: 'neutral' | 'success'; action?: { label: string; onClick: () => void } }
const Ctx = createContext<(t: Omit<Toast, 'id'>) => void>(() => {})
export const useToast = () => useContext(Ctx)

const BASE_MS = 5000
const ACTION_MS = 10000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    setToasts((all) => [...all, { ...t, id: ++seq.current }].slice(-3))
  }, [])
  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), [])
  return (
    <Ctx.Provider value={push}>
      {children}
      <ol aria-live="polite" aria-label="Notifications" className="pointer-events-none fixed inset-x-4 bottom-4 z-(--layer-toast) flex flex-col items-end gap-2 sm:left-auto sm:w-96">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
      </ol>
    </Ctx.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false)
  const hasAction = !!toast.action
  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => onDismiss(toast.id), hasAction ? ACTION_MS : BASE_MS)
    return () => clearTimeout(t)
  }, [paused, onDismiss, toast.id, hasAction])
  return (
    <li
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 surface rounded-card p-4 shadow-overlay',
        'animate-[wd-pop-in_var(--motion-duration-small)_var(--ease-out)]',
      )}
    >
      {toast.tone && toast.tone !== 'neutral' && (
        <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-success" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-fg-muted">{toast.description}</p>}
      </div>
      {toast.action && (
        <button
          onClick={() => { toast.action!.onClick(); onDismiss(toast.id) }}
          className="-my-1 min-h-11 shrink-0 rounded-control px-3 text-sm font-semibold text-primary-text hover:bg-primary-soft"
        >
          {toast.action.label}
        </button>
      )}
      <button onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification" className="-m-2 grid size-11 shrink-0 place-items-center rounded-control text-fg-muted hover:text-fg">
        <svg viewBox="0 0 16 16" aria-hidden className="size-4 fill-current"><path d="M3.7 2.6 8 6.9l4.3-4.3 1.1 1.1L9.1 8l4.3 4.3-1.1 1.1L8 9.1l-4.3 4.3-1.1-1.1L6.9 8 2.6 3.7z" /></svg>
      </button>
    </li>
  )
}
