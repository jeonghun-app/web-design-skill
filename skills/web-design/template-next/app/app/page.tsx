import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/metadata'
import { AppDemoPage } from '@/screens/app-demo'

export const metadata: Metadata = pageMetadata({
  title: 'Product demo: the triage inbox',
  description: 'The Lumen product demo: a triage inbox with filters, bulk actions, a command palette and undo.',
  path: '/app',
})

export default function Page() {
  return <AppDemoPage />
}
