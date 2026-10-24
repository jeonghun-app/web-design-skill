import * as TabsPrimitive from '@radix-ui/react-tabs'
import { motion } from 'motion/react'
import { useId, useState, type ComponentProps } from 'react'

// Arrow keys move between tabs (Radix, FK-04). The indicator slides with a short spring
// so the eye follows the change of selection (spatial continuity).
export function Tabs({ items, defaultValue, className }: {
  items: { value: string; label: string; content: React.ReactNode }[]
  defaultValue?: string
  className?: string
}) {
  const [value, setValue] = useState(defaultValue ?? items[0]?.value)
  const layoutId = useId()
  return (
    <TabsPrimitive.Root value={value} onValueChange={setValue} className={className}>
      <TabsPrimitive.List className="relative flex gap-1 border-b border-border" aria-label="Sections">
        {items.map((it) => (
          <TabsPrimitive.Trigger
            key={it.value}
            value={it.value}
            className="relative min-h-11 px-3 text-sm font-medium text-fg-muted transition-colors duration-(--motion-duration-micro) hover:text-fg data-[state=active]:text-fg"
          >
            {it.label}
            {value === it.value && (
              <motion.span layoutId={layoutId} transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((it) => (
        <TabsPrimitive.Content key={it.value} value={it.value} className="pt-5 focus-visible:outline-offset-4">
          {it.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}

export function TabsList(props: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List {...props} />
}
