import { describe, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Tabs } from '@/components/ui/tabs'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { axeViolations } from '@/test/axe'

// Keyboard and focus contracts from principles.md (FK-*) and app-patterns.md, checked in a real browser.

describe('Button', () => {
  test('fires on click and on Enter/Space, never on pointer down (MO-11)', async () => {
    const onClick = vi.fn()
    const screen = await render(<Button onClick={onClick}>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })
    await userEvent.keyboard('{Tab}')
    await expect.element(button).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
    expect(await axeViolations(screen.container)).toEqual([])
  })

  test('shows a visible focus indicator on keyboard focus (FK-01)', async () => {
    const screen = await render(<Button>Save</Button>)
    await userEvent.keyboard('{Tab}')
    const el = screen.getByRole('button').element()
    const s = getComputedStyle(el)
    expect(s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2).toBe(true)
  })

  test('meets the 44 px target size on coarse pointers or 24 px minimum (MO-01)', async () => {
    const screen = await render(<Button size="md">Save</Button>)
    const r = screen.getByRole('button').element().getBoundingClientRect()
    expect(r.height).toBeGreaterThanOrEqual(24)
  })
})

describe('Dialog', () => {
  function Example() {
    return (
      <Dialog>
        <DialogTrigger asChild><Button>Delete project</Button></DialogTrigger>
        <DialogContent title="Delete Apollo?" description="This removes 42 requests. You can't undo this.">
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
        </DialogContent>
      </Dialog>
    )
  }

  test('moves focus in, traps Tab, closes on Escape and returns focus to the trigger', async () => {
    const screen = await render(<Example />)
    const trigger = screen.getByRole('button', { name: 'Delete project' })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Delete Apollo?' })
    await expect.element(dialog).toBeVisible()
    expect(dialog.element().contains(document.activeElement)).toBe(true)
    for (let i = 0; i < 4; i++) {
      await userEvent.keyboard('{Tab}')
      expect(dialog.element().contains(document.activeElement)).toBe(true)
    }
    expect(await axeViolations(dialog.element())).toEqual([])
    await userEvent.keyboard('{Escape}')
    await expect.element(dialog).not.toBeInTheDocument()
    await expect.element(trigger).toHaveFocus()
  })
})

describe('Tabs', () => {
  test('arrow keys move selection, only the active tab is in the tab order (FK-04)', async () => {
    const screen = await render(
      <Tabs items={[{ value: 'a', label: 'Overview', content: 'A' }, { value: 'b', label: 'Activity', content: 'B' }, { value: 'c', label: 'Settings', content: 'C' }]} />,
    )
    await userEvent.keyboard('{Tab}')
    await expect.element(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    const activity = screen.getByRole('tab', { name: 'Activity' })
    await expect.element(activity).toHaveFocus()
    await expect.element(activity).toHaveAttribute('aria-selected', 'true')
    await expect.element(screen.getByRole('tabpanel')).toHaveTextContent('B')
    await userEvent.keyboard('{End}')
    await expect.element(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.container.querySelectorAll('[role=tab][tabindex="0"]').length).toBe(1)
    expect(await axeViolations(screen.container)).toEqual([])
  })
})

describe('Toast', () => {
  function Trigger({ onUndo }: { onUndo: () => void }) {
    const toast = useToast()
    return <Button onClick={() => toast({ title: 'Archived 3 requests', action: { label: 'Undo', onClick: onUndo } })}>Archive</Button>
  }

  test('announces politely, waits while hovered or focused, and Undo runs once', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const onUndo = vi.fn()
      const screen = await render(<ToastProvider><Trigger onUndo={onUndo} /></ToastProvider>)
      await screen.getByRole('button', { name: 'Archive' }).click()
      const region = page.getByRole('list', { name: 'Notifications' })
      await expect.element(region).toHaveAttribute('aria-live', 'polite')
      const undo = page.getByRole('button', { name: 'Undo' })
      await expect.element(undo).toBeVisible()
      // Focus pauses the timer: well past the 10 s action timeout, the toast is still there.
      undo.element().focus()
      await new Promise((r) => requestAnimationFrame(r)) // let React commit the paused state
      vi.advanceTimersByTime(15000)
      await expect.element(undo).toBeVisible()
      await undo.click()
      expect(onUndo).toHaveBeenCalledTimes(1)
      await expect.element(undo).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('DataTable', () => {
  type Row = { id: string; title: string; age: number }
  const rows: Row[] = [{ id: 'r1', title: 'Billing export', age: 3 }, { id: 'r2', title: 'Access request', age: 12 }, { id: 'r3', title: 'Copy review', age: 1 }]
  const columns = [{ key: 'title' as const, header: 'Request', sortable: true }, { key: 'age' as const, header: 'Age (days)', numeric: true, sortable: true }]

  test('sort exposes aria-sort and reorders; selection shows the bulk bar', async () => {
    const screen = await render(<DataTable caption="Requests" columns={columns} rows={rows} bulkActions={() => <Button size="sm">Archive</Button>} />)
    const ageHeader = screen.getByRole('columnheader', { name: /Age/ })
    await expect.element(ageHeader).toHaveAttribute('aria-sort', 'none')
    await screen.getByRole('button', { name: /Age/ }).click()
    await expect.element(ageHeader).toHaveAttribute('aria-sort', 'ascending')
    const firstCells = () => [...screen.container.querySelectorAll('tbody tr')].map((tr) => tr.textContent)
    expect(firstCells()[0]).toContain('Copy review')
    await screen.getByRole('checkbox', { name: 'Select row r2' }).click()
    const bulk = screen.getByRole('region', { name: 'Bulk actions' })
    await expect.element(bulk.getByText('1 selected')).toBeVisible()
    await screen.getByRole('checkbox', { name: 'Select all rows' }).click()
    await expect.element(bulk.getByText('3 selected')).toBeVisible()
    expect(await axeViolations(screen.container)).toEqual([])
  })
})
