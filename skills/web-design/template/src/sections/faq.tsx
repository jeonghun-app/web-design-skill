import { SectionHeading } from '@/components/ui/section-heading'

// Native <details>: keyboard and screen-reader support for free; whole row is the target (MO-06).
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <section id="faq" className="section-y container-page">
      <SectionHeading title="Questions, answered" />
      <div className="mx-auto mt-12 max-w-3xl divide-y divide-border border-y border-border">
        {items.map((it) => (
          <details key={it.q} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
              {it.q}
              <svg viewBox="0 0 16 16" aria-hidden className="size-4 shrink-0 fill-current transition-transform duration-(--motion-duration-small) ease-(--ease-standard) group-open:rotate-45"><path d="M7.25 2h1.5v5.25H14v1.5H8.75V14h-1.5V8.75H2v-1.5h5.25z" /></svg>
            </summary>
            <p className="prose-measure pb-5 text-fg-muted">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
