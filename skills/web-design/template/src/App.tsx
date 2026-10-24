import { Bento } from '@/sections/bento'
import { Cta } from '@/sections/cta'
import { Faq } from '@/sections/faq'
import { Footer } from '@/sections/footer'
import { Hero } from '@/sections/hero'
import { Logos } from '@/sections/logos'
import { Nav } from '@/sections/nav'
import { Pricing } from '@/sections/pricing'
import { Stats } from '@/sections/stats'
import { Testimonial } from '@/sections/testimonial'
import { TrendSwitcher } from '@/dev/trend-switcher'

// Showcase page: every section reads only semantic tokens, so switching the trend
// (dev panel, ?trend=<id>, or `trend.mjs apply <id>`) restyles the whole page.
export default function App() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-surface focus:p-3">
        Skip to content
      </a>
      <Nav links={[{ href: '#features', label: 'Product' }, { href: '#pricing', label: 'Pricing' }, { href: '#faq', label: 'FAQ' }]} />
      <main id="main">
        <Hero />
        <Logos names={['Northwind', 'Contoso', 'Globex', 'Initech', 'Umbrella', 'Hooli']} />
        <Bento
          eyebrow="Product"
          title="Everything your team asks for, in one queue"
          lede="Requests arrive from chat, email and forms. Lumen sorts them so the next right task is always on top."
          tiles={[
            { title: 'Smart triage', text: 'New requests are tagged, sized and routed before anyone opens them.', span: 'hero', visual: <TriageVisual /> },
            { title: 'Review in context', text: 'Comments, files and history sit next to the work.' },
            { title: 'Calm notifications', text: 'One daily digest instead of fifty pings.' },
            { title: 'Workflows', text: 'Turn repeat work into templates in two clicks.', span: 'wide' },
            { title: 'Audit trail', text: 'Every change is recorded and searchable.' },
          ]}
        />
        <Stats items={[{ value: '38%', label: 'less time in status meetings' }, { value: '2.4×', label: 'faster request turnaround' }, { value: '12k', label: 'teams on Lumen' }, { value: '99.98%', label: 'uptime last 12 months' }]} />
        <Testimonial quote="We closed our backlog in three weeks. The queue tells everyone what matters next, so nobody has to ask." name="Mina Park" role="Head of Operations, Northwind" />
        <Pricing
          plans={[
            { name: 'Free', monthly: 0, yearly: 0, blurb: 'For small teams getting started.', features: ['Up to 10 members', 'Unlimited requests', 'Email and chat intake'] },
            { name: 'Team', monthly: 12, yearly: 10, blurb: 'For teams that run on Lumen.', features: ['Unlimited members', 'Workflows and templates', 'Priority support'], featured: true },
            { name: 'Business', monthly: 24, yearly: 19, blurb: 'For organisations with compliance needs.', features: ['SSO and SCIM', 'Audit trail export', 'Dedicated success manager'] },
          ]}
        />
        <Faq
          items={[
            { q: 'Can I import from my current tool?', a: 'Yes. Imports from CSV and the most common trackers keep assignees, labels and history.' },
            { q: 'Is there a free plan?', a: 'Teams of up to 10 people can use Lumen free with no time limit.' },
            { q: 'How is my data protected?', a: 'Data is encrypted in transit and at rest, and Business plans include SSO and audit export.' },
          ]}
        />
        <Cta title="Give your team one calm place to work" text="Set up in five minutes. Bring your requests with you." />
      </main>
      <Footer columns={[{ title: 'Product', links: ['Features', 'Pricing', 'Changelog'] }, { title: 'Company', links: ['About', 'Careers', 'Contact'] }, { title: 'Resources', links: ['Docs', 'Guides', 'Status'] }]} />
      {import.meta.env.DEV && <TrendSwitcher />}
    </>
  )
}

function TriageVisual() {
  const tags = ['Bug · S', 'Design · M', 'Copy · S', 'Infra · L', 'Legal · M']
  return (
    <div className="flex h-full flex-wrap content-end gap-2" aria-hidden>
      {tags.map((t, i) => (
        <span key={t} className={i === 0 ? 'rounded-pill bg-primary px-3 py-1.5 text-sm text-primary-fg' : 'rounded-pill border border-border bg-surface-sunken px-3 py-1.5 text-sm'}>{t}</span>
      ))}
    </div>
  )
}
