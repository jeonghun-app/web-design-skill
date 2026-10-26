import type { Metadata, Viewport } from 'next'
import { AppProviders } from '@/app-providers'
import fonts from '@/design/fonts.json'
import { OG_IMAGE, SITE_NAME } from '@/lib/metadata'
import { fontVariables } from '@/design/fonts'
import './globals.css'

// SEO and share head (web-quality.md SE-*). Next renders it into the HTML, so crawlers and
// share bots see it without running JS. SITE_URL in .env is the real origin.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Lumen · The calm work queue for busy teams', template: '%s · Lumen' },
  description: 'Lumen sorts requests from chat, email and forms into one queue, so your team always knows the next right task.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: 'Lumen · The calm work queue for busy teams',
    description: 'One queue for every request, sorted so the next right task is always on top.',
    url: '/',
    images: [OG_IMAGE],
  },
  twitter: { card: 'summary_large_image' },
  icons: {
    icon: [{ url: '/favicon.png', sizes: '48x48', type: 'image/png' }, { url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
}

// theme-color = color.bg (light/dark) from tokens.resolved.json, as hex for browser support.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfcfd' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0d11' },
  ],
}

// Set theme and trend before first paint so there is no flash of the wrong style. Same
// logic as the Vite template's index.html. Not a cookie: reading cookies() here would make
// every route dynamic.
const appearance = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('wd-theme');
if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.dataset.theme=t;
var r=new URLSearchParams(location.search).get('trend')||localStorage.getItem('wd-trend');
if(r==='none')delete d.dataset.trend;else if(r)d.dataset.trend=r;}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the appearance script changes data-theme/data-trend before React hydrates.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* design-lint-allow CL-12 static inline script, no user input */}
        <script dangerouslySetInnerHTML={{ __html: appearance }} />
        {fonts.eager.map((href) => <link key={href} rel="stylesheet" href={href} />)}
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
