// url=https://www.figma.com/design/FILE_KEY/web-design?node-id=BUTTON_SET_ID
// source=src/components/ui/button.tsx
// component=Button
// Properties match the `button` step of figma-library.mjs. State (Hover/Focus) is runtime
// behavior in code, so only Disabled maps to a prop.
import figma from 'figma'
const instance = figma.selectedInstance

const label = instance.getString('Label')
const variant = instance.getEnum('Variant', { Solid: 'solid', Outline: 'outline', Ghost: 'ghost' })
const size = instance.getEnum('Size', { MD: 'md', LG: 'lg' })
const disabled = instance.getEnum('State', { Default: false, Hover: false, Focus: false, Disabled: true })

export default {
  example: figma.code`<Button variant="${variant}" size="${size}"${disabled ? ' disabled' : ''}>${label}</Button>`,
  imports: ['import { Button } from "@/components/ui/button"'],
  id: 'button',
  metadata: { nestable: true },
}
