// url=https://www.figma.com/design/FILE_KEY/web-design?node-id=BADGE_SET_ID
// source=src/components/ui/badge.tsx
// component=Badge
import figma from 'figma'
const instance = figma.selectedInstance

const label = instance.getString('Label')
const tone = instance.getEnum('Tone', { Brand: 'brand', Neutral: 'neutral', Success: 'success', Danger: 'danger' })

export default {
  example: figma.code`<Badge tone="${tone}">${label}</Badge>`,
  imports: ['import { Badge } from "@/components/ui/badge"'],
  id: 'badge',
  metadata: { nestable: true },
}
