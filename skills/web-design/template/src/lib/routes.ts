// Every in-app href comes from here, so pages and sections work under both routers.
// The Vite template uses hash routes (any static host, no server config). The Next.js
// template replaces this file with real paths (template-next/src/lib/routes.ts).
export const routes = {
  home: '#/',
  app: '#/app',
  system: '#/system',
  /** A section of the style guide: #/system/<id>. */
  section: (id: string) => `#/system/${id}`,
  /** The style-guide section named by the current URL, if any. */
  currentSection: () => location.hash.split('/')[2],
  navigate: (href: string) => { location.hash = href.replace(/^#/, '') },
}
