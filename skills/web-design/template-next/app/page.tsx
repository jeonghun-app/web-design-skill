import { LandingPage } from '@/screens/landing'

const SITE = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

// Organization + WebSite structured data on the home page (SE-16).
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Lumen Labs', url: `${SITE}/`, logo: `${SITE}/icon-512.png` },
    { '@type': 'WebSite', '@id': `${SITE}/#website`, name: 'Lumen', url: `${SITE}/`, publisher: { '@id': `${SITE}/#org` } },
  ],
}

export default function Page() {
  return (
    <>
      {/* design-lint-allow CL-12 JSON-LD from a constant; '<' escaped so it can't close the tag */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <LandingPage />
    </>
  )
}
