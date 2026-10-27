// Contact and legal live in the footer, where users expect them (LA-07, TR-03).
export function Footer({ columns }: { columns: { title: string; links: { label: string; href: string }[] }[] }) {
  return (
    <footer className="border-t border-border">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(3,1fr)]">
        <div>
          <p className="font-semibold">Lumen</p>
          <p className="mt-2 max-w-xs text-sm text-fg-muted">The calm work queue for busy teams.</p>
        </div>
        {columns.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className="text-sm font-semibold">{c.title}</p>
            <ul className="mt-3 grid gap-1">
              {c.links.map((l) => (
                <li key={l.label}><a href={l.href} className="inline-flex min-h-11 min-w-11 items-center text-sm text-fg-muted hover:text-fg pointer-fine:min-h-8">{l.label}</a></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="container-page border-t border-border py-6 text-sm text-fg-muted">
        © 2026 Lumen Labs · <a href="/privacy" className="hover:text-fg">Privacy</a> · <a href="/terms" className="hover:text-fg">Terms</a>
      </p>
    </footer>
  )
}
