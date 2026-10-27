// url=https://www.figma.com/design/FILE_KEY/web-design?node-id=FIELD_SET_ID
// source=src/components/ui/field.tsx
// component=Field
// Focus is runtime behavior. Error shows the error prop with the text of the Error layer.
import figma from 'figma'
const instance = figma.selectedInstance

const label = instance.getString('Label')
const state = instance.getEnum('State', { Default: 'default', Focus: 'default', Error: 'error', Disabled: 'disabled' })
// findText returns an error handle (no textContent) when the layer is absent.
const message = instance.findText('Error').textContent ?? 'Enter a valid email address.'

export default {
  example: figma.code`<Field label="${label}" type="email"${state === 'disabled' ? ' disabled' : ''}${state === 'error' ? figma.code` error="${message}"` : ''} />`,
  imports: ['import { Field } from "@/components/ui/field"'],
  id: 'field',
  metadata: { nestable: true },
}
