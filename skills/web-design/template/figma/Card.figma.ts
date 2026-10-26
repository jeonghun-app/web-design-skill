// url=https://www.figma.com/design/FILE_KEY/web-design?node-id=CARD_ID
// source=src/components/ui/card.tsx
// component=Card
import figma from 'figma'
const instance = figma.selectedInstance

const title = instance.getString('Title')
const body = instance.getString('Body')

export default {
  example: figma.code`<Card>
  <CardTitle>${title}</CardTitle>
  <CardText>${body}</CardText>
</Card>`,
  imports: ['import { Card, CardText, CardTitle } from "@/components/ui/card"'],
  id: 'card',
  metadata: { nestable: false },
}
