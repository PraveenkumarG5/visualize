import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import WidgetCreator from './WidgetCreator'
import { dataService, widgetService } from '../../services/api'

// Mock the services
vi.mock('../../services/api', () => ({
  widgetService: {
    preview: vi.fn(),
  },
  dataService: {
    getUniqueValues: vi.fn(),
  },
}));

// JSDOM doesn't implement setSelectionRange, which is used in the Widget component
// and can cause unrelated errors during tests.
HTMLInputElement.prototype.setSelectionRange = vi.fn();


describe('WidgetCreator', () => {
  const mockOpenColumns = ['Location', 'DM', 'GDH']
  const mockReleaseColumns = ['Project', 'Owner']

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    widgetService.preview.mockResolvedValue({ data: { labels: [], values: [] } })
  })

  it('should fetch and display filter values when a filter column is selected', async () => {
    const user = userEvent.setup()
    const mockFilterValues = ['Hyderabad', 'Bengaluru', 'Chennai']
    dataService.getUniqueValues.mockResolvedValue({ data: mockFilterValues })

    render(
      <WidgetCreator
        onAddWidget={vi.fn()}
        openColumns={mockOpenColumns}
        releaseColumns={mockReleaseColumns}
      />
    )

    // Find the "Filters" column dropdown (there might be multiple "Select column" dropdowns)
    const filterColumnSelect = screen.getAllByRole('combobox', { name: /column/i })[1];

    // Select the 'GDH' column to filter by
    await user.selectOptions(filterColumnSelect, 'GDH')

    // Verify that the API was called to get unique values for 'GDH'
    expect(dataService.getUniqueValues).toHaveBeenCalledTimes(1)
    expect(dataService.getUniqueValues).toHaveBeenCalledWith('open', 'GDH')

    // Find the filter value dropdown and check for the new options
    const filterValueSelect = screen.getByRole('combobox', { name: /value/i });
    for (const value of mockFilterValues) {
        expect(await screen.findByRole('option', { name: value })).toBeTruthy()
    }
  })
})