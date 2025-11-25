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

// Mock Recharts components
vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="recharts-responsive-container">{children}</div>,
    BarChart: (props) => <div data-testid="recharts-barchart" {...props} />,
    LineChart: (props) => <div data-testid="recharts-linechart" {...props} />,
    XAxis: (props) => <div data-testid="recharts-xaxis" {...props} />
  }
})

import Widget from '../Widget'
import { widgetService } from '../../services/api'

describe('Widget', () => {
  beforeEach(() => {
    widgetService.preview.mockResolvedValue({ data: { labels: ['A'], values: [1] } })
  })

  describe('inline title editing', () => {
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

  describe('chart rendering', () => {
    it('should pass correct props to BarChart and XAxis', async () => {
      const config = {
        type: 'bar',
        title: 'Bar Chart'
      }
      render(<Widget config={config} />)
      await waitFor(() => {
        expect(screen.getByTestId('recharts-barchart')).toHaveAttribute(
          'margin',
          '[object Object]'
        )
      })
      const xAxis = screen.getByTestId('recharts-xaxis')
      expect(xAxis).toHaveAttribute('angle', '-45')
      expect(xAxis).toHaveAttribute('textAnchor', 'end')
      expect(xAxis).toHaveAttribute('interval', '0')
    })

    it('should pass correct props to LineChart and XAxis', async () => {
        const config = {
          type: 'line',
          title: 'Line Chart'
        }
        render(<Widget config={config} />)
        await waitFor(() => {
          expect(screen.getByTestId('recharts-linechart')).toHaveAttribute(
            'margin',
            '[object Object]'
          )
        })
        const xAxis = screen.getByTestId('recharts-xaxis')
        expect(xAxis).toHaveAttribute('angle', '-45')
        expect(xAxis).toHaveAttribute('textAnchor', 'end')
        expect(xAxis).toHaveAttribute('interval', '0')
      })
  })
})
