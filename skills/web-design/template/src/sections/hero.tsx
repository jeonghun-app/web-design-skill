import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// One focal point: headline + one primary CTA inside the first viewport (LA-01, LA-04, TR-01).
// The product visual sits below/aside and is cut by the fold to invite scrolling (E8).
export function Hero() {
  return (
    <section data-slot="hero" className="relative isolate overflow-hidden">
      <div aria-hidden data-slot="hero-bg" className="absolute inset-0 -z-10 [background:var(--effect-hero-bg)]" />
      <div data-slot="hero-grid" className="container-page grid items-center gap-12 pt-16 pb-20 sm:pt-24 lg:grid-cols-[1.05fr_1fr] lg:pt-28">
        <div>
          <Badge tone="brand" dot>New · Workflows 2.0</Badge>
          <h1 data-slot="display" className="mt-6 text-display font-[number:var(--font-weight-display)] tracking-display [text-transform:var(--effect-display-transform)]">
            <Words text="Ship the work, not the busywork." />
          </h1>
          <p className="mt-6 max-w-xl text-lede text-fg-muted">
            Lumen turns scattered requests into one calm queue. Plan, assign and review in a single place your whole team actually opens.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg">Start free</Button>
            <Button size="lg" variant="outline" tone="neutral">Book a demo</Button>
          </div>
          <p className="mt-4 text-sm text-fg-muted">Free for teams up to 10 · No card required</p>
        </div>
        <ProductPreview />
      </div>
    </section>
  )
}

// Words are wrapped so trend packs can stagger them (`[data-slot=display-word]`, `--i`);
// the text stays one readable string for assistive tech.
function Words({ text }: { text: string }) {
  return text.split(' ').map((w, i, all) => (
    <span key={i}>
      <span data-slot="display-word" className="inline-block" style={{ '--i': i } as React.CSSProperties}>{w}</span>
      {i < all.length - 1 && ' '}
    </span>
  ))
}

function ProductPreview() {
  const rows = [
    { t: 'Q4 launch checklist', s: 'In review', w: 'w-3/4' },
    { t: 'Pricing page copy', s: 'In progress', w: 'w-1/2' },
    { t: 'Onboarding emails', s: 'Done', w: 'w-full' },
    { t: 'Support macros', s: 'Planned', w: 'w-1/4' },
  ]
  return (
    <div data-slot="hero-visual" className="surface rounded-panel p-3 shadow-overlay" role="img" aria-label="Preview of the Lumen task queue">
      <div className="flex items-center gap-1.5 px-2 pb-3" aria-hidden>
        <span className="size-2.5 rounded-full bg-border-strong" />
        <span className="size-2.5 rounded-full bg-border-strong" />
        <span className="size-2.5 rounded-full bg-border-strong" />
      </div>
      <div className="grid gap-2 rounded-card bg-surface-sunken p-3">
        {rows.map((r) => (
          <div key={r.t} className="flex items-center gap-3 rounded-control bg-surface p-3 shadow-card">
            <span className="size-4 rounded-full border-2 border-primary" aria-hidden />
            <span className="flex-1 truncate text-sm font-medium">{r.t}</span>
            <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-surface-sunken sm:block" aria-hidden>
              <span className={`block h-full rounded-full bg-primary ${r.w}`} />
            </span>
            <span className="text-xs text-fg-muted">{r.s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
