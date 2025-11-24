import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// jsdom in the test environment doesn't provide ResizeObserver; mock it
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// mock the widgetService.preview used inside Widget
vi.mock('../../services/api', () => ({
  widgetService: {
    preview: vi.fn()
  }
}))

import Widget from '../Widget'
import { widgetService } from '../../services/api'

describe('Widget inline title editing', () => {
  beforeEach(() => {
    widgetService.preview.mockResolvedValue({ data: { labels: ['A'], values: [1] } })
  })

  it('allows clicking the title to edit, updating on blur', async () => {
    const onUpdate = vi.fn()
    const config = {
      id: 'w1',
      title: 'Old Title',
      type: 'pie',
      dataSource: 'open',
      groupBy: ['Location'],
      operation: 'count',
      filters: {}
    }

    render(<Widget config={config} onUpdate={onUpdate} />)

    // title should be visible
    const titleEl = await screen.findByText('Old Title')
    expect(titleEl).toBeTruthy()

    // click to edit
    await userEvent.click(titleEl)

    // input should appear with current value
    const input = screen.getByDisplayValue('Old Title')
    expect(input).toBeTruthy()

    // change value
    await userEvent.clear(input)
    await userEvent.type(input, 'New Title')

    // blur to trigger save
    fireEvent.blur(input)

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled()
    })

    // called with updated title
    const updatedArg = onUpdate.mock.calls[0][0]
    expect(updatedArg.title).toBe('New Title')
  })
})
