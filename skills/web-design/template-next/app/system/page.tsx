import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/metadata'
import { SystemPage } from '@/screens/system'

export const metadata: Metadata = pageMetadata({
  title: 'Lumen Design: the design system',
  description: 'Lumen Design: the tokens, components and patterns behind Lumen, live in every trend and theme.',
  path: '/system',
})

export default function Page() {
  return <SystemPage />
}
