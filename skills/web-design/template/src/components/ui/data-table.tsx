import { useMemo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type Column<T> = {
  key: keyof T & string
  header: string
  align?: 'start' | 'end'
  numeric?: boolean
  sortable?: boolean
  render?: (row: T) => ReactNode
}

// Tables: numbers right-aligned in tabular figures, text left; sortable headers expose
// aria-sort; sticky header; whole-row selection with a bulk bar; density via `density`.
export function DataTable<T extends { id: string }>({
  columns, rows, density = 'default', caption, bulkActions, empty,
}: {
  columns: Column<T>[]
  rows: T[]
  density?: 'compact' | 'default' | 'relaxed'
  caption: string
  bulkActions?: (selected: T[]) => ReactNode
  empty?: ReactNode
}) {
  const [sort, setSort] = useState<{ key: string; dir: 'ascending' | 'descending' } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const sorted = useMemo(() => {
    if (!sort) return rows
    const s = [...rows].sort((a, b) => {
      const x = a[sort.key as keyof T], y = b[sort.key as keyof T]
      return typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
    })
    return sort.dir === 'descending' ? s.reverse() : s
  }, [rows, sort])
  const rowH = { compact: 'h-8', default: 'h-11', relaxed: 'h-14' }[density]
  const allChecked = rows.length > 0 && selected.size === rows.length
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <div className="surface overflow-hidden rounded-card">
      {bulkActions && selected.size > 0 && (
        <div className="flex min-h-12 items-center gap-3 border-b border-border bg-primary-soft px-4 text-sm text-primary-soft-fg" role="region" aria-label="Bulk actions">
          <span className="font-medium">{selected.size} selected</span>
          <div className="ml-auto flex gap-2">{bulkActions(rows.filter((r) => selected.has(r.id)))}</div>
        </div>
      )}
      {/* TBL-07: on narrow screens the table scrolls sideways in a focusable, labeled region. */}
      <div className="max-h-[28rem] overflow-auto" role="region" aria-label={caption} tabIndex={0}>
        <table className="w-full min-w-[40rem] border-collapse whitespace-nowrap text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-border">
              {bulkActions && (
                <th scope="col" className="w-12 px-4">
                  <label className="-mx-3 grid size-11 cursor-pointer place-items-center">
                    <input type="checkbox" aria-label="Select all rows" checked={allChecked} onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)))} className="size-4 accent-(--color-primary)" />
                  </label>
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={sort?.key === c.key ? sort.dir : c.sortable ? 'none' : undefined}
                  className={cn('h-11 px-4 font-medium text-fg-muted', c.align === 'end' || c.numeric ? 'text-right' : 'text-left')}
                >
                  {c.sortable ? (
                    <button
                      className={cn('-mx-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 hover:text-fg pointer-fine:min-h-9', (c.align === 'end' || c.numeric) && 'flex-row-reverse')}
                      onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === 'ascending' ? 'descending' : 'ascending' }))}
                    >
                      {c.header}
                      <svg viewBox="0 0 16 16" aria-hidden className={cn('size-3.5 fill-current transition-transform duration-(--motion-duration-micro)', sort?.key === c.key ? 'opacity-100' : 'opacity-30', sort?.key === c.key && sort.dir === 'descending' && 'rotate-180')}><path d="M8 3l4 5H4z" /></svg>
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={columns.length + (bulkActions ? 1 : 0)}>{empty ?? <p className="p-8 text-center text-fg-muted">No rows.</p>}</td></tr>
            )}
            {sorted.map((r) => (
              <tr key={r.id} aria-selected={bulkActions ? selected.has(r.id) : undefined} className={cn(rowH, 'border-b border-border last:border-0 hover:bg-surface-sunken aria-selected:bg-primary-soft/40')}>
                {bulkActions && (
                  <td className="px-4">
                    <label className="-mx-3 grid size-11 cursor-pointer place-items-center">
                      <input type="checkbox" aria-label={`Select row ${r.id}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="size-4 accent-(--color-primary)" />
                    </label>
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4', (c.align === 'end' || c.numeric) && 'text-right', c.numeric && 'tabular-nums')}>
                    {c.render ? c.render(r) : String(r[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
