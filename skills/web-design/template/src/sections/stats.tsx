// Concrete numbers are scanned before prose; 3-4 max so each stays memorable (C1).
export function Stats({ items }: { items: { value: string; label: string }[] }) {
  return (
    <section aria-label="Results" className="border-y border-border bg-surface-sunken">
      <dl className="container-page grid gap-8 py-14 text-center sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="flex flex-col gap-1">
            <dt className="text-sm text-fg-muted">{s.label}</dt>
            <dd className="order-first text-h2 font-[number:var(--font-weight-display)] tracking-display">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
