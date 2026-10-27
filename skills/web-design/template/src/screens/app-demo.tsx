'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CommandPalette, type Command } from '@/components/ui/command-palette'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { Field } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { useDelayedFlag } from '@/lib/use-delayed-flag'
import { Tabs } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/cn'
import { routes } from '@/lib/routes'

type Request = { id: string; title: string; requester: string; status: 'Open' | 'In review' | 'Done'; size: number; age: number }

const ROWS: Request[] = [
  { id: 'REQ-1042', title: 'Refund for duplicate charge', requester: 'Mina Park', status: 'Open', size: 2, age: 3 },
  { id: 'REQ-1041', title: 'Update pricing page copy', requester: 'Leo Kim', status: 'In review', size: 5, age: 26 },
  { id: 'REQ-1039', title: 'SSO for the Seoul office', requester: 'Ana Ruiz', status: 'Open', size: 8, age: 41 },
  { id: 'REQ-1036', title: 'Export audit log as CSV', requester: 'Sam Lee', status: 'Done', size: 3, age: 72 },
  { id: 'REQ-1031', title: 'Onboarding email sequence', requester: 'Yuna Choi', status: 'In review', size: 5, age: 96 },
]

const NAV = [
  { label: 'Inbox', count: 12 },
  { label: 'My requests', count: 4 },
  { label: 'Team queue', count: 31 },
  { label: 'Reports' },
  { label: 'Settings' },
]

// Product grammar demo: sidebar shell (drawer on mobile), top bar with ⌘K, KPI cards,
// a dense table with bulk actions, dialog and menu overlays, toasts with undo.
// The tooltip provider lives on the page that uses tooltips, so its positioning engine
// (floating-ui) loads with this chunk instead of the landing page.
export function AppDemoPage() {
  return (
    <TooltipProvider>
      <AppDemo />
    </TooltipProvider>
  )
}

function AppDemo() {
  const toast = useToast()
  const [navOpen, setNavOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const showSkeleton = useDelayedFlag(loading)
  const [rows, setRows] = useState(ROWS)

  const refresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1200)
  }
  // Undo puts back exactly what this action removed, in the original order, without
  // reviving rows that later actions removed.
  const order = (r: Request[]) => [...r].sort((a, b) => ROWS.findIndex((x) => x.id === a.id) - ROWS.findIndex((x) => x.id === b.id))
  const archive = (ids: string[]) => {
    const removed = rows.filter((x) => ids.includes(x.id))
    if (!removed.length) return
    setRows((r) => r.filter((x) => !ids.includes(x.id)))
    toast({
      title: `${removed.length} request${removed.length > 1 ? 's' : ''} archived`,
      action: { label: 'Undo', onClick: () => setRows((r) => order([...r, ...removed.filter((x) => !r.some((y) => y.id === x.id))])) },
    })
  }

  const commands: Command[] = [
    { id: 'new', label: 'Create request', group: 'Actions', hint: 'C', run: () => toast({ title: 'New request drafted', tone: 'success' }) },
    { id: 'refresh', label: 'Refresh queue', group: 'Actions', run: refresh },
    { id: 'inbox', label: 'Go to Inbox', group: 'Navigation', run: () => {} },
    { id: 'reports', label: 'Go to Reports', group: 'Navigation', run: () => {} },
    { id: 'landing', label: 'Open marketing page', group: 'Navigation', run: () => routes.navigate(routes.home) },
  ]

  const columns: Column<Request>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (r) => <span className="font-mono text-xs text-fg-muted">{r.id}</span> },
    { key: 'title', header: 'Request', sortable: true, render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'requester', header: 'Requester', sortable: true },
    {
      key: 'status', header: 'Status', sortable: true,
      render: (r) => <Badge tone={r.status === 'Done' ? 'success' : r.status === 'Open' ? 'brand' : 'neutral'} dot>{r.status}</Badge>,
    },
    { key: 'size', header: 'Points', numeric: true, sortable: true },
    { key: 'age', header: 'Age (h)', numeric: true, sortable: true },
  ]

  const sidebar = (
    <nav aria-label="App" className="flex h-full flex-col gap-1 p-3">
      <a href={routes.home} className="mb-3 flex min-h-11 items-center gap-2 px-2 font-semibold">
        <span aria-hidden className="grid size-7 place-items-center rounded-control bg-primary text-primary-fg">◆</span>
        Lumen
      </a>
      <p className="px-2 pb-1 pt-2 text-xs font-medium text-fg-muted">Workspace</p>
      {NAV.map((n, i) => (
        <a
          key={n.label}
          href={routes.app}
          onClick={() => setNavOpen(false)}
          aria-current={i === 0 ? 'page' : undefined}
          className="flex min-h-11 items-center justify-between rounded-control px-2 text-sm text-fg-muted hover:bg-surface-sunken hover:text-fg aria-[current=page]:bg-primary-soft aria-[current=page]:font-medium aria-[current=page]:text-primary-soft-fg pointer-fine:min-h-9"
        >
          {n.label}
          {n.count !== undefined && <span className="text-xs tabular-nums">{n.count}</span>}
        </a>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-border bg-surface lg:block">{sidebar}</aside>
      <Dialog open={navOpen} onOpenChange={setNavOpen}>
        <DialogContent side="left" title="Menu">{sidebar}</DialogContent>
      </Dialog>

      <div className="min-w-0 flex-1">
        <header className="chrome sticky top-0 z-(--layer-sticky) flex h-14 items-center gap-2 border-b border-border px-4">
          <Button variant="ghost" tone="neutral" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setNavOpen(true)}>
            <svg viewBox="0 0 20 20" aria-hidden className="fill-current"><path d="M3 5h14v1.5H3zM3 9.25h14v1.5H3zM3 13.5h14V15H3z" /></svg>
          </Button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-11 flex-1 items-center gap-2 rounded-control border pointer-fine:h-10 border-border bg-surface-sunken px-3 text-sm text-fg-muted hover:border-border-strong sm:max-w-sm"
          >
            <svg viewBox="0 0 16 16" aria-hidden className="size-4 fill-current"><path d="M7 2a5 5 0 0 1 3.9 8.1l3 3-1 1-3-3A5 5 0 1 1 7 2Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /></svg>
            <span className="truncate"><span className="sm:hidden">Search</span><span className="hidden sm:inline">Search or run a command</span></span>
            <kbd className="ml-auto hidden font-mono text-xs sm:inline">⌘K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <Tooltip content="Refresh queue">
              <Button variant="ghost" tone="neutral" size="icon" aria-label="Refresh queue" onClick={refresh}>
                <svg viewBox="0 0 16 16" aria-hidden className="fill-current"><path d="M8 2.5a5.5 5.5 0 0 1 5.3 4h-1.6A4 4 0 1 0 12 9h1.5A5.5 5.5 0 1 1 8 2.5Zm4.5-.5v4h-4z" /></svg>
              </Button>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" tone="neutral" size="icon" aria-label="Account menu">
                  <span aria-hidden className="grid size-7 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary-soft-fg">MP</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Notification settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem tone="danger">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-h3 font-semibold">Inbox</h1>
              <p className="mt-1 text-sm text-fg-muted">Requests waiting for your team, newest first.</p>
            </div>
            <div className="hidden sm:block">
              <NewRequestDialog onCreate={(t) => toast({ title: 'Request created', description: t, tone: 'success' })} />
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Open requests', value: '12', delta: '+3 today' },
              { label: 'Median first reply', value: '1.8 h', delta: '−0.4 h vs last week' },
              { label: 'Resolved this week', value: '47', delta: '+12%' },
            ].map((k) => (
              <div key={k.label} className="surface flex flex-col rounded-card p-3 sm:p-4">
                <dt className="min-h-8 text-xs text-fg-muted sm:min-h-0 sm:text-sm">{k.label}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{showSkeleton ? <Skeleton className="h-8 w-20" /> : k.value}</dd>
                <dd className="mt-auto pt-1 text-xs text-fg-muted">{k.delta}</dd>
              </div>
            ))}
          </dl>

          <Tabs
            className="mt-8"
            items={[
              {
                value: 'queue', label: 'Queue',
                content: showSkeleton ? (
                  <div className="surface grid gap-3 rounded-card p-4" aria-busy="true" aria-label="Loading requests">
                    {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-7" />)}
                  </div>
                ) : (
                  <DataTable
                    caption="Requests in the team queue"
                    columns={columns}
                    rows={rows}
                    bulkActions={(sel) => (
                      <Button size="sm" variant="outline" tone="neutral" onClick={() => archive(sel.map((s) => s.id))}>Archive</Button>
                    )}
                    empty={<EmptyState illustration="empty-inbox" title="Inbox zero" text="Every request has an owner. New ones will appear here." action={<Button size="sm" variant="outline" tone="neutral" onClick={() => setRows(ROWS)}>Restore demo data</Button>} />}
                  />
                ),
              },
              { value: 'mine', label: 'Assigned to me', content: <EmptyState illustration="getting-started" title="Nothing assigned to you" text="Requests you own show up here." /> },
              { value: 'done', label: 'Done', content: <EmptyState illustration="success" title="No resolved requests yet" text="Finished requests are kept for 90 days." /> },
            ]}
          />
        </main>
      </div>
      {/* MO-05: on phones the primary action lives in a sticky bottom bar, in thumb reach. */}
      <div className="chrome fixed inset-x-0 bottom-0 z-(--layer-sticky) border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
        <NewRequestDialog block onCreate={(t) => toast({ title: 'Request created', description: t, tone: 'success' })} />
      </div>
      <CommandPalette commands={commands} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}

function NewRequestDialog({ onCreate, block }: { onCreate: (title: string) => void; block?: boolean }) {
  const [title, setTitle] = useState('')
  const [touched, setTouched] = useState(false)
  const [open, setOpen] = useState(false)
  const error = touched && title.trim().length < 4 ? 'Enter at least 4 characters so the team knows what this is.' : undefined
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setTitle(''); setTouched(false) } }}>
      <DialogTrigger asChild>
        <Button className={block ? 'w-full' : undefined} size={block ? 'lg' : 'md'}>New request</Button>
      </DialogTrigger>
      <DialogContent title="New request" description="Describe what you need. You can add files after it is created.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setTouched(true)
            if (title.trim().length < 4) return
            onCreate(title.trim())
            setOpen(false)
          }}
          className="grid gap-4"
          noValidate
        >
          <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => setTouched(true)} error={error} hint={error ? undefined : 'A short summary, like “Refund for order 1182”.'} autoFocus />
          <DialogFooter className={cn('mt-2')}>
            <DialogClose asChild>
              <Button type="button" variant="outline" tone="neutral">Cancel</Button>
            </DialogClose>
            <Button type="submit">Create request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
