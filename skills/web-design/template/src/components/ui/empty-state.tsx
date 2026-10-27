import type { ReactNode } from 'react'
import { Illustration, type IllustrationName } from '@/illustrations'

// Empty state: what this is, why it's empty, one primary next step (patterns.md).
// First-use states may carry a spot illustration; no-results states stay text-first
// (IL-21), so pass `illustration` only where the art helps.
export function EmptyState({ icon, illustration, title, text, action }: { icon?: ReactNode; illustration?: IllustrationName; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-14 text-center">
      {illustration && <Illustration name={illustration} size="md" className="mb-4 size-30" />}
      {!illustration && icon && <div aria-hidden className="mb-4 grid size-12 place-items-center rounded-card bg-surface-sunken text-fg-muted [&_svg]:size-6">{icon}</div>}
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-fg-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
