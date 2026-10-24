// A single named, specific quote beats a wall of vague ones (credibility cues, T6).
export function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <section className="section-y container-page">
      <figure className="mx-auto max-w-3xl sm:text-center">
        <blockquote className="text-h3 leading-snug font-[number:var(--font-weight-heading)] text-balance">“{quote}”</blockquote>
        <figcaption className="mt-8 flex items-center gap-3 sm:justify-center">
          <span aria-hidden className="grid size-11 place-items-center rounded-full bg-primary-soft font-semibold text-primary-soft-fg">
            {name.split(' ').map((p) => p[0]).join('')}
          </span>
          <span className="text-left">
            <span className="block font-semibold">{name}</span>
            <span className="block text-sm text-fg-muted">{role}</span>
          </span>
        </figcaption>
      </figure>
    </section>
  )
}
