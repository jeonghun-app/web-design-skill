import { Reveal } from '@/components/motion/reveal'
import { Card, CardText, CardTitle } from '@/components/ui/card'
import { SectionHeading } from '@/components/ui/section-heading'
import { cn } from '@/lib/cn'

type Tile = { title: string; text: string; span?: 'wide' | 'tall' | 'hero'; visual?: React.ReactNode }

// Bento: tile size encodes importance, so the eye ranks features without reading (preattentive size).
// Keep 4-6 tiles; one hero tile; collapse to one column on mobile.
export function Bento({ eyebrow, title, lede, tiles }: { eyebrow: string; title: string; lede: string; tiles: Tile[] }) {
  return (
    <section id="features" className="section-y container-page">
      <SectionHeading eyebrow={eyebrow} title={title} lede={lede} />
      <div data-slot="bento" className="mt-14 grid auto-rows-[minmax(12rem,auto)] gap-4 md:grid-cols-3">
        {tiles.map((t, i) => (
          <Reveal
            key={t.title}
            delay={i * 60}
            className={cn(t.span === 'hero' && 'md:col-span-2 md:row-span-2', t.span === 'wide' && 'md:col-span-2', t.span === 'tall' && 'md:row-span-2')}
          >
            <Card className="flex h-full flex-col overflow-hidden">
              <CardTitle>{t.title}</CardTitle>
              <CardText>{t.text}</CardText>
              {t.visual && <div className="mt-6 flex-1">{t.visual}</div>}
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
