'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import trends from '@/design/trends.json'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardText, CardTitle } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { DoDont } from '@/components/ui/do-dont'
import { EmptyState } from '@/components/ui/empty-state'
import { Field } from '@/components/ui/field'
import { Tabs } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { Illustration, ILLUSTRATIONS } from '@/illustrations'
import { useAppearance } from '@/lib/appearance'
import { cn } from '@/lib/cn'
import { routes } from '@/lib/routes'

// Living style guide (#/system): the design introduction page, built from the same
// tokens and components it documents. Section order follows what most published design
// systems share: Overview → Get started → Foundations → Components → Patterns → Changelog.
// Everything restyles live with the trend/theme controls in the header.

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'principles', label: 'Principles' },
  { id: 'get-started', label: 'Get started' },
  { id: 'color', label: 'Color', group: 'Foundations' },
  { id: 'typography', label: 'Typography', group: 'Foundations' },
  { id: 'spacing', label: 'Spacing & shape', group: 'Foundations' },
  { id: 'motion', label: 'Motion', group: 'Foundations' },
  { id: 'illustration', label: 'Illustration', group: 'Foundations' },
  { id: 'components', label: 'Components' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'changelog', label: 'Changelog' },
]

const COLOR_PAIRS: [fg: string, bg: string, use: string][] = [
  ['fg', 'bg', 'Body text'],
  ['fg-muted', 'bg', 'Secondary text'],
  ['fg', 'surface', 'Text on cards'],
  ['primary-fg', 'primary', 'Primary button'],
  ['primary-text', 'bg', 'Links and eyebrows'],
  ['accent-fg', 'accent', 'Accent fill'],
  ['danger', 'bg', 'Error text'],
  ['border-strong', 'bg', 'Input borders (3:1)'],
]
const SWATCHES = ['bg', 'surface', 'surface-sunken', 'fg', 'fg-muted', 'border', 'border-strong', 'primary', 'primary-soft', 'accent', 'success', 'warning', 'danger', 'ring']

// Resolve any CSS color (oklch, relative color, color-mix) through a canvas, then WCAG math.
function useResolvedColors(names: string[], deps: unknown[]) {
  const [rgb, setRgb] = useState<Record<string, [number, number, number]>>({})
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
      const probe = document.createElement('span')
      document.body.appendChild(probe)
      const out: Record<string, [number, number, number]> = {}
      // Translucent tokens are shown as they render: composited over the page background.
      probe.style.color = 'var(--color-bg)'
      const bgCss = getComputedStyle(probe).color
      for (const n of names) {
        probe.style.color = `var(--color-${n})`
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = bgCss
        ctx.fillRect(0, 0, 1, 1)
        ctx.fillStyle = getComputedStyle(probe).color
        ctx.fillRect(0, 0, 1, 1)
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
        out[n] = [r, g, b]
      }
      probe.remove()
      setRgb(out)
    })
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return rgb
}
const lum = ([r, g, b]: [number, number, number]) => {
  const f = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a: [number, number, number], b: [number, number, number]) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const hex = ([r, g, b]: [number, number, number]) => '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')

function ContrastBadge({ value, min }: { value: number; min: number }) {
  const level = value >= 7 ? 'AAA' : value >= min ? 'AA' : 'Fail'
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-semibold tabular-nums', level === 'Fail' ? 'bg-danger text-danger-fg' : 'bg-surface-sunken text-fg')}>
      {level} {value.toFixed(1)}:1
    </span>
  )
}

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1200) })}
      className="min-h-11 rounded-control px-2 text-left font-mono text-xs text-fg-muted hover:bg-surface-sunken hover:text-fg pointer-fine:min-h-7"
      aria-label={`Copy ${text}`}
    >
      {done ? 'Copied' : text}
    </button>
  )
}

function Section({ id, eyebrow, title, lede, children, as: H = 'h2' }: { id: string; eyebrow?: string; title: string; lede?: string; children: React.ReactNode; as?: 'h1' | 'h2' }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-border py-16 first:border-t-0 first:pt-0">
      {eyebrow && <p data-slot="eyebrow" className="text-sm font-semibold uppercase tracking-caps text-primary-text">{eyebrow}</p>}
      <H id={`${id}-title`} className="mt-2 text-h2">{title}</H>
      {lede && <p className="prose-measure mt-3 text-lede text-fg-muted">{lede}</p>}
      <div className="mt-8">{children}</div>
    </section>
  )
}

export function SystemPage() {
  const { trend, setTrend, theme, setTheme } = useAppearance()
  const toast = useToast()
  const names = useMemo(() => [...new Set([...SWATCHES, ...COLOR_PAIRS.flatMap(([f, b]) => [f, b])])], [])
  const rgb = useResolvedColors(names, [trend, theme])
  const activePack = trends.find((t) => t.id === trend)
  const [active, setActive] = useState('overview')
  const mainRef = useRef<HTMLElement>(null)

  // Deep links (routes.section) scroll there on load, on in-page links and on back/forward.
  useEffect(() => {
    const go = () => { const id = routes.currentSection(); if (id) document.getElementById(id)?.scrollIntoView() }
    go()
    window.addEventListener('hashchange', go)
    return () => window.removeEventListener('hashchange', go)
  }, [])
  // Scroll-spy for the side navigation (aria-current on the visible section).
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (vis) setActive(vis.target.id)
    }, { rootMargin: '-20% 0px -70% 0px' })
    mainRef.current?.querySelectorAll('section[id]').forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  // Consecutive grouping keeps the documented order (Foundations sits between Get started and Components).
  const groups = SECTIONS.reduce<{ group: string; items: typeof SECTIONS }[]>((acc, s) => {
    const g = s.group ?? ''
    if (acc.at(-1)?.group === g) acc.at(-1)!.items.push(s)
    else acc.push({ group: g, items: [s] })
    return acc
  }, [])

  return (
    <div className="min-h-dvh">
      <header className="chrome sticky top-0 z-(--layer-sticky) border-b border-border">
        <div className="flex h-(--layout-nav-h) items-center gap-3 px-4 sm:px-6">
          <a href={routes.home} className="flex min-h-11 min-w-0 items-center gap-2 font-semibold">
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-control bg-primary text-primary-fg">◆</span>
            <span className="truncate">Lumen <span className="hidden font-normal text-fg-muted sm:inline">Design</span></span>
          </a>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <span className="hidden text-fg-muted sm:inline">Trend</span>
              <select
                aria-label="Trend"
                value={trend}
                onChange={(e) => setTrend(e.target.value)}
                className="h-11 max-w-32 rounded-control border border-border-strong bg-surface px-2 text-sm sm:max-w-none sm:px-3 pointer-fine:h-9"
              >
                <option value="none">Base</option>
                {trends.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <Button variant="outline" tone="neutral" size="sm" className="pointer-coarse:h-11" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[90rem]">
        <nav aria-label="Style guide" className="sticky top-(--layout-nav-h) hidden h-[calc(100dvh-var(--layout-nav-h))] w-64 shrink-0 overflow-y-auto border-r border-border p-4 lg:block">
          {groups.map(({ group: g, items }, gi) => (
            <div key={gi} className="mb-3">
              {g && <p className="px-2 pb-1 pt-3 text-xs font-medium text-fg-muted">{g}</p>}
              {items.map((s) => (
                <a
                  key={s.id}
                  href={routes.section(s.id)}
                  onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView(); history.replaceState(null, '', routes.section(s.id)) }}
                  aria-current={active === s.id ? 'location' : undefined}
                  className="flex min-h-9 items-center rounded-control px-2 text-sm text-fg-muted hover:bg-surface-sunken hover:text-fg aria-[current=location]:bg-primary-soft aria-[current=location]:font-medium aria-[current=location]:text-primary-soft-fg pointer-coarse:min-h-11"
                >
                  {s.label}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <main id="main" ref={mainRef} className="min-w-0 flex-1 px-4 py-12 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <Section id="overview" as="h1" title="Lumen Design" lede="The tokens, components and patterns behind Lumen. One system for Figma and React: switch the trend or theme above and every example on this page restyles live.">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { t: 'Design', d: 'Figma library generated from the same tokens, with Light and Dark modes.', a: routes.section('get-started') },
                  { t: 'Build', d: 'React components that read semantic tokens only.', a: routes.section('components') },
                  { t: 'Get started', d: 'Scaffold a project, pick a trend, audit it.', a: routes.section('get-started') },
                ].map((c) => (
                  <a key={c.t} href={c.a} className="group block rounded-card focus-visible:outline-offset-4">
                    <Card interactive className="h-full">
                      {/* Directly under the page h1, so h2 (SE-06). */}
                      <CardTitle as="h2">{c.t}</CardTitle>
                      <CardText>{c.d}</CardText>
                    </Card>
                  </a>
                ))}
              </div>
              <p className="prose-measure mt-6 text-fg-muted">
                Active trend: <strong className="font-[number:var(--font-weight-heading)] text-fg">{activePack?.name ?? 'Base'}</strong>
                {activePack && <> · {activePack.stage} · {activePack.summary}</>}
              </p>
            </Section>

            <Section id="principles" eyebrow="Approach" title="Principles" lede="Four rules every screen answers to. When a trend and a principle disagree, the principle wins.">
              <ol className="grid gap-6 sm:grid-cols-2">
                {[
                  ['Start from the person, not the pixels', 'Name the user, the job and the success metric before drawing. Real content first, chrome last.'],
                  ['One focal point, then calm', 'Each view earns one bold move. Everything else is quiet, aligned and on the scale.'],
                  ['Every state is designed', 'Hover, focus, loading, empty, error and long-content states ship with the happy path.'],
                  ['Accessible is the floor, not the finish', 'Contrast, targets, focus and reduced motion are checked automatically on every trend.'],
                ].map(([h, p], i) => (
                  <li key={h} className="flex gap-4">
                    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-pill bg-primary-soft font-semibold tabular-nums text-primary-soft-fg">{i + 1}</span>
                    <div><h3 className="text-lg font-[number:var(--font-weight-heading)]">{h}</h3><p className="mt-1 text-fg-muted">{p}</p></div>
                  </li>
                ))}
              </ol>
            </Section>

            <Section id="get-started" title="Get started" lede="Scaffold, choose a trend, check it. The same commands drive Figma.">
              <pre tabIndex={0} role="region" aria-label="Commands" className="overflow-x-auto rounded-card bg-surface-sunken p-5 font-mono text-sm leading-relaxed"><code>{`node scripts/new-project.mjs ../my-site --install --trend ${trend === 'none' ? 'signal-dark' : trend}
npm run trend -- list
npm run audit -- --trends all
npm run figma-sync -- push > design/build/figma-push.js   # run with use_figma`}</code></pre>
            </Section>

            <Section id="color" eyebrow="Foundations" title="Color" lede="Semantic tokens only. Contrast is measured live for the active trend and theme.">
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7" aria-label="Color tokens">
                {SWATCHES.map((n) => (
                  <li key={n}>
                    <div className="h-16 rounded-control border border-border" style={{ background: `var(--color-${n})` }} />
                    <p className="mt-2 text-sm font-medium">{n}</p>
                    <Copy text={`var(--color-${n})`} />
                    {rgb[n] && <p className="font-mono text-xs text-fg-muted">{hex(rgb[n])}</p>}
                  </li>
                ))}
              </ul>
              <h3 className="mt-10 text-h3">Contrast pairs</h3>
              <div className="mt-4 overflow-x-auto" role="region" aria-label="Contrast pairs" tabIndex={0}>
                <table className="w-full min-w-[32rem] text-sm">
                  <thead><tr className="border-b border-border text-left text-fg-muted"><th scope="col" className="py-2 font-medium">Sample</th><th scope="col" className="font-medium">Pair</th><th scope="col" className="font-medium">Use</th><th scope="col" className="text-right font-medium">WCAG</th></tr></thead>
                  <tbody>
                    {COLOR_PAIRS.map(([f, b, use]) => {
                      const min = f === 'border-strong' ? 3 : 4.5
                      return (
                        <tr key={f + b} className="border-b border-border last:border-0">
                          <td className="py-3">
                            {f === 'border-strong' ? (
                              <span aria-hidden className="inline-block h-9 w-14 rounded-control" style={{ background: `var(--color-${b})`, border: `2px solid var(--color-${f})` }} />
                            ) : (
                              <span className="inline-flex h-9 items-center rounded-control px-3 font-semibold" style={{ color: `var(--color-${f})`, background: `var(--color-${b})` }}>Aa</span>
                            )}
                          </td>
                          <td className="font-mono text-xs">{f} / {b}</td>
                          <td className="text-fg-muted">{use}</td>
                          <td className="text-right">{rgb[f] && rgb[b] ? <ContrastBadge value={ratio(rgb[f], rgb[b])} min={min} /> : '…'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section id="typography" eyebrow="Foundations" title="Typography" lede="One scale, fluid only at display sizes. Line-height tightens as size grows.">
              <div className="grid gap-5" data-audit-specimen>
                {[
                  ['display', 'Display', 'text-display font-[number:var(--font-weight-display)] tracking-display'],
                  ['h2', 'Heading 2', 'text-h2'],
                  ['h3', 'Heading 3', 'text-h3 font-semibold'],
                  ['lede', 'Lede', 'text-lede'],
                  ['base', 'Body', 'text-base'],
                  ['sm', 'Small', 'text-sm'],
                ].map(([k, label, cls]) => (
                  <div key={k} className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:items-baseline">
                    <Copy text={`text-${k}`} />
                    <p className={cn(cls, 'truncate [font-family:var(--font-display)]', k !== 'display' && k !== 'h2' && k !== 'h3' && '[font-family:var(--font-sans)]')}>{label} — Ship the work</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="spacing" eyebrow="Foundations" title="Spacing & shape" lede="A 4px scale for every gap and padding; one radius knob from which control, card and panel corners derive.">
              <div className="grid gap-8 sm:grid-cols-2">
                <ul className="grid gap-2" aria-label="Spacing scale">
                  {['1', '2', '3', '4', '6', '8', '12', '16'].map((k) => (
                    <li key={k} className="flex items-center gap-3">
                      <span className="h-4 rounded-sm bg-primary" style={{ width: `var(--space-${k})` }} />
                      <Copy text={`--space-${k}`} />
                    </li>
                  ))}
                </ul>
                <ul className="flex flex-wrap gap-4" aria-label="Radius and elevation">
                  {[['control', 'raised'], ['card', 'card'], ['panel', 'overlay']].map(([r, s]) => (
                    <li key={r} className="text-center">
                      <div className="size-24 border border-border bg-surface" style={{ borderRadius: `var(--radius-${r})`, boxShadow: `var(--shadow-${s})` }} />
                      <p className="mt-2 font-mono text-xs text-fg-muted">radius-{r}<br />shadow-{s}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </Section>

            <Section id="motion" eyebrow="Foundations" title="Motion" lede="Enter decelerates, exit accelerates, nothing over 500ms. Reduced motion turns these into instant changes.">
              <MotionDemo />
            </Section>

            <Section id="illustration" eyebrow="Foundations" title="Illustration" lede="One style family drawn from tokens: stroke, caps, radius, palette and shadow change with the trend. Objects only, no text in the art.">
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Illustrations">
                {ILLUSTRATIONS.map((n) => (
                  <li key={n} className="grid place-items-center gap-2 rounded-card border border-border bg-surface p-4">
                    <Illustration name={n} size="sm" className="size-24" />
                    <span className="font-mono text-xs text-fg-muted">{n}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <DoDont tone="do" caption="Use art in first-use empty states, next to the action.">
                  <EmptyState illustration="getting-started" title="No projects yet" text="Create one to start tracking work." action={<Button size="sm">Create project</Button>} />
                </DoDont>
                <DoDont tone="dont" caption="Don't decorate no-results states; say what to change instead.">
                  <div className="grid justify-items-center gap-2 opacity-90"><Illustration name="no-results" size="sm" /><p className="text-sm">Nothing here!</p></div>
                </DoDont>
              </div>
            </Section>

            <Section id="components" title="Components" lede="Every component exposes variant × tone × size, emits data-slot/data-variant, and has all its states.">
              <Tabs
                items={[
                  {
                    value: 'button', label: 'Button', content: (
                      <div className="grid gap-6" data-audit-specimen>
                        <div className="flex flex-wrap gap-3">
                          <Button>Solid</Button>
                          <Button variant="soft">Soft</Button>
                          <Button variant="outline" tone="neutral">Outline</Button>
                          <Button variant="ghost" tone="neutral">Ghost</Button>
                          <Button variant="link">Text link</Button>
                          <Button tone="danger" variant="outline">Delete</Button>
                          <Button disabled>Disabled</Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <DoDont tone="do" caption="One solid action per view; the rest are outline or ghost (LA-01).">
                            <div className="flex gap-2"><Button>Save changes</Button><Button variant="outline" tone="neutral">Cancel</Button></div>
                          </DoDont>
                          <DoDont tone="dont" caption="Two equal solid buttons make people stop and compare.">
                            <div className="flex gap-2"><Button>Save</Button><Button tone="neutral">Publish</Button></div>
                          </DoDont>
                        </div>
                      </div>
                    ),
                  },
                  {
                    value: 'field', label: 'Field', content: (
                      <div className="grid max-w-md gap-5">
                        <Field label="Email" type="email" hint="We only use this for receipts." placeholder="name@company.com" />
                        <Field label="Email" type="email" defaultValue="mina@" error="Enter an email like name@company.com" />
                      </div>
                    ),
                  },
                  {
                    value: 'feedback', label: 'Feedback', content: (
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge tone="brand" dot>New</Badge>
                        <Badge tone="success" dot>Done</Badge>
                        <Badge tone="danger" dot>Blocked</Badge>
                        <Button variant="outline" tone="neutral" onClick={() => toast({ title: 'Settings saved', tone: 'success' })}>Show toast</Button>
                        <Dialog>
                          <DialogTrigger asChild><Button variant="outline" tone="neutral">Open dialog</Button></DialogTrigger>
                          <DialogContent title="Delete project “Atlas”?" description="Its 24 files will be removed for everyone. This can't be undone." size="sm">
                            <DialogFooter>
                              <DialogClose asChild><Button variant="outline" tone="neutral">Keep project</Button></DialogClose>
                              <DialogClose asChild><Button tone="danger">Delete project</Button></DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ),
                  },
                ]}
              />
            </Section>

            <Section id="patterns" title="Patterns" lede="Compositions with a job. See app-patterns.md and conversion.md for the full catalog.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card><EmptyState illustration="empty-inbox" title="Inbox zero" text="Every request has an owner. New ones will appear here." /></Card>
                <Card><EmptyState illustration="secure" title="Turn on two-step sign-in" text="Protect payouts with a code from your phone." action={<Button size="sm">Set up</Button>} /></Card>
              </div>
            </Section>

            <Section id="changelog" title="Changelog" lede="Trend packs are dated and re-reviewed, so the look can follow fashion without drifting from the principles.">
              <ul className="grid gap-3">
                {trends.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-3 last:border-0">
                    <span className="font-[number:var(--font-weight-heading)]">{t.name}</span>
                    <Badge tone={t.stage === 'rising' ? 'brand' : 'neutral'}>{t.stage}</Badge>
                    {/* Full-width row, measure capped inside: a capped flex item would fit beside the name. */}
                    <span className="basis-full"><span className="prose-measure block text-fg-muted">{t.summary}</span></span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </main>
      </div>
    </div>
  )
}

function MotionDemo() {
  const [on, setOn] = useState(false)
  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
      <Button variant="outline" tone="neutral" onClick={() => setOn(!on)} aria-pressed={on}>{on ? 'Reset' : 'Play'}</Button>
      <div className="grid gap-2" aria-hidden>
        {[['micro', 'ease-standard'], ['small', 'ease-out'], ['large', 'ease-out'], ['reveal', 'ease-out']].map(([d, e]) => (
          <div key={d} className="flex items-center gap-3">
            <span className="w-28 font-mono text-xs text-fg-muted">{d}</span>
            <div className="relative h-8 flex-1 rounded-control bg-surface-sunken p-1 [container-type:inline-size]">
              {/* transform only (MT-06): cqw lets translate span the track width */}
              <span
                className="block size-6 rounded-control bg-primary transition-[translate]"
                style={{ translate: on ? 'calc(100cqw - 1.5rem) 0' : '0 0', transitionDuration: `var(--motion-duration-${d})`, transitionTimingFunction: `var(--${e})` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
