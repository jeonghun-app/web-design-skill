// Social proof right after the hero: borrowed trust before the feature pitch (T6).
export function Logos({ names }: { names: string[] }) {
  return (
    <section aria-label="Customers" className="container-page py-10">
      <p className="text-center text-sm text-fg-muted">Trusted by teams at</p>
      <ul className="mt-6 grid grid-cols-2 items-center gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
        {names.map((n) => (
          <li key={n} className="text-center text-lg font-semibold tracking-heading text-fg-muted">{n}</li>
        ))}
      </ul>
    </section>
  )
}
