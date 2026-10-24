import { Button } from '@/components/ui/button'

// Closing CTA repeats the hero promise for readers who scrolled to the end (peak-end, C12).
export function Cta({ title, text }: { title: string; text: string }) {
  return (
    <section className="container-page pb-(--layout-section-y)">
      <div className="relative isolate overflow-hidden rounded-panel bg-fg px-6 py-16 text-center text-bg sm:px-16">
        <div aria-hidden className="absolute inset-0 -z-10 opacity-60 [background:var(--effect-hero-bg)]" />
        <h2 className="mx-auto max-w-2xl text-h2">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lede opacity-80">{text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="bg-bg! text-fg! hover:opacity-90">Start free</Button>
        </div>
      </div>
    </section>
  )
}
