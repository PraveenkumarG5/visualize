import { useState, useEffect } from 'react'
import { widgetService, dataService } from '../services/api'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

function WidgetCreator({ onAddWidget, openColumns, releaseColumns, initialConfig, onSave, onCancel }) {
  const [config, setConfig] = useState({
    title: '',
    type: 'pie',
    dataSource: 'open',
    groupBy: [],
    operation: 'count',
    valueColumn: null,
    filters: {},
    isTitleUserEdited: false,
  })
  const [previewData, setPreviewData] = useState(null)
  const [availableColumns, setAvailableColumns] = useState([])
  const [filterColumn, setFilterColumn] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [filterValueOptions, setFilterValueOptions] = useState([])
  const [numericColumns, setNumericColumns] = useState([])
  const [multiFilterValues, setMultiFilterValues] = useState(new Set())

  useEffect(() => {
    setAvailableColumns(config.dataSource === 'open' ? openColumns : releaseColumns)
  }, [config.dataSource, openColumns, releaseColumns])

  useEffect(() => {
    // Heuristic to determine numeric columns. This could be improved with metadata from the backend.
    const numericCols = availableColumns.filter(col => {
      // Example heuristic: columns that don't have "Name", "Location", "DM", "GDH", "Technology" might be numeric.
      return !['Account Name', 'Location', 'DM', 'GDH', 'Technology', 'Project Name'].includes(col);
    });
    setNumericColumns(numericCols);
  }, [availableColumns]);

  useEffect(() => {
    if (initialConfig) {
      // populate local config when editing an existing widget
      setConfig({
        title: initialConfig.title || '',
        type: initialConfig.type || 'pie',
        dataSource: initialConfig.dataSource || 'open',
        groupBy: initialConfig.groupBy || [],
        operation: initialConfig.operation || 'count',
        valueColumn: initialConfig.valueColumn || null,
        filters: initialConfig.filters || {},
        id: initialConfig.id,
        isTitleUserEdited: initialConfig.isTitleUserEdited || false,
      })
    }
  }, [initialConfig])

  useEffect(() => {
    if (config.isTitleUserEdited) return;

    const generateTitle = () => {
      let title = '';
      if (config.operation === 'revenue_loss') {
        title = config.groupBy.length ? `Revenue Loss by ${config.groupBy.join(', ')}` : 'Total Revenue Loss';
      } else {
        if (!config.groupBy.length && config.type !== 'number') {
          return '';
        }

        const op = {
          count: 'Count',
          sum: 'Sum',
          avg: 'Average',
        }[config.operation];

        let titleParts = [];
        if (config.type === 'number') {
          if (config.operation === 'count') {
            titleParts.push('Total Records');
          } else {
            titleParts.push(`${op} of ${config.valueColumn || 'Records'}`);
          }
        } else {
          if (config.operation === 'count') {
            titleParts.push(`Count by ${config.groupBy.join(', ')}`);
          } else {
            titleParts.push(`${op} of ${config.valueColumn || 'Records'} by ${config.groupBy.join(', ')}`);
          }
        }
        title = titleParts.join(' ');
      }

      const dataSourceText = config.dataSource === 'open' ? 'Open Requirements' : 'Release List';
      const filterDetails = Object.entries(config.filters)
        .map(([key, value]) => Array.isArray(value) ? `${key} in (${value.join(', ')})` : `${key}: '${value}'`)
        .join(', ');

      let finalTitle = `${title} from ${dataSourceText}`;
      if (filterDetails) {
        finalTitle += ` (filtered by ${filterDetails})`;
      }
      return finalTitle;
    };

    const newTitle = generateTitle();
    if (newTitle && newTitle !== config.title) {
        setConfig(prevConfig => ({ ...prevConfig, title: newTitle }));
    }
  }, [config.dataSource, config.groupBy, config.operation, config.valueColumn, config.filters, config.type, config.isTitleUserEdited, config.title]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (filterColumn) {
        try {
          const response = await dataService.getUniqueValues(config.dataSource, filterColumn)
          setFilterValueOptions(response.data || [])
        } catch (error) {
          console.error('Error fetching filter values:', error)
          setFilterValueOptions([])
        }
      } else {
        setFilterValueOptions([])
      }
    }
    fetchFilterOptions()
  }, [filterColumn, config.dataSource])

  useEffect(() => {
    if (previewData?.invalidRowNumbers?.length > 0) {
      console.debug('Debug: Invalid rows detected in preview:', previewData.invalidRowNumbers);
    }
  }, [previewData]);

  const handlePreview = async () => {
    try {
      const payload = { ...config };
      if (config.type === 'number') {
        payload.groupBy = [];
      } else if (config.groupBy.length === 0) {
        payload.groupBy = [availableColumns[0] || ''];
      }

      const response = await widgetService.preview(payload)
      setPreviewData(response.data)
    } catch (err) {
      console.error('Preview error:', err)
      alert('Error generating preview: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleAddFilter = () => {
    if (!filterColumn) return;

    let valueToAdd;
    if (filterColumn === 'Status') {
      valueToAdd = Array.from(multiFilterValues);
      if (valueToAdd.length === 0) return;
    } else {
      valueToAdd = filterValue;
      if (!valueToAdd) return;
    }

    setConfig({
      ...config,
      filters: { ...config.filters, [filterColumn]: valueToAdd },
    });

    // Reset fields
    setFilterColumn('');
    setFilterValue('');
    setMultiFilterValues(new Set());
  };

  const handleRemoveFilter = (key) => {
    const newFilters = { ...config.filters };
    delete newFilters[key];
    setConfig({ ...config, filters: newFilters });
  };
  
  const handleMultiFilterChange = (value, isChecked) => {
    setMultiFilterValues(prev => {
        const newSet = new Set(prev);
        if (isChecked) {
            newSet.add(value);
        } else {
            newSet.delete(value);
        }
        return newSet;
    });
  };

  const valueFormatter = (value) => {
    if (config.operation === 'revenue_loss' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    return value;
  };

  const renderChart = () => {
    if (!previewData || !previewData.labels || previewData.labels.length === 0) {
      return <div className="text-gray-500 p-8 text-center">No data to display</div>
    }

    const chartData = previewData.labels.map((label, index) => ({
      name: label,
      value: previewData.values[index],
    }))

    switch (config.type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={valueFormatter} />
              <Legend formatter={(value, entry) => `${value}: ${valueFormatter(entry.payload.value)}`} />
            </PieChart>
          </ResponsiveContainer>
        )
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 5, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} />
              <YAxis tickFormatter={valueFormatter} />
              <Tooltip formatter={valueFormatter} />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 5, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} />
              <YAxis tickFormatter={valueFormatter} />
              <Tooltip formatter={valueFormatter} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'number':
        const rawValue = previewData.values && previewData.values[0] ? previewData.values[0] : 0;
        return (
          <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-800">
                {valueFormatter(rawValue)}
              </div>
            </div>
          </div>
        )
      default:
        return <div>Unsupported chart type</div>
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-bold mb-4">{initialConfig ? 'Edit Widget' : 'Create Widget'}</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
                      <input
                        type="text"
                        value={config.title || ''}
                        onChange={(e) => {
                          const newTitle = e.target.value
                          setConfig({
                            ...config,
                            title: newTitle,
                            isTitleUserEdited: newTitle.trim().length > 0, // Set true if user types anything
                          })
                        }}
                        placeholder="Widget title (auto-generated)"
                        className="w-full px-4 py-2 border rounded"
                      />
                  </div>
          
        <div>
          <label className="block text-sm font-medium mb-2">Data Source</label>
          <select
            value={config.dataSource}
            onChange={(e) => {
              setConfig({ ...config, dataSource: e.target.value, groupBy: [], filters: {} })
              setFilterColumn('')
              setFilterValue('')
              setFilterValueOptions([])
            }
            }
            className="w-full px-4 py-2 border rounded"
          >
            <option value="open">Open Requirements</option>
            <option value="release">Release List</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Chart Type</label>
          <select
            value={config.type}
            onChange={(e) => {
              const newType = e.target.value
              const newConfig = { ...config, type: newType }
              if (newType === 'number') {
                newConfig.groupBy = []
              }
              setConfig(newConfig)
            }}
            className="w-full px-4 py-2 border rounded"
          >
            <option value="pie">Pie Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="number">Number Tile</option>
          </select>
        </div>

        {config.operation === 'revenue_loss' ? (
          <div>
            <label className="block text-sm font-medium mb-2">Group By</label>
            <select
              value={config.groupBy[0] || ''}
              onChange={(e) => setConfig({ ...config, groupBy: e.target.value ? [e.target.value] : [] })}
              className="w-full px-4 py-2 border rounded"
            >
              <option value="">Total</option>
              {['CP', 'GDH', 'DM'].map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
              <label className="block text-sm font-medium mb-2">Group By Column</label>
              <select
                value={config.groupBy[0] || ""}
                onChange={(e) => setConfig({ ...config, groupBy: e.target.value ? [e.target.value] : [] })}
                className="w-full px-4 py-2 border rounded disabled:bg-gray-100"
                disabled={config.type === 'number'}
              >
                <option value="">Select column</option>
                {availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Operation</label>
          <select
            value={config.operation}
            onChange={(e) => {
              const newOperation = e.target.value;
              const newConfig = { ...config, operation: newOperation, groupBy: [], valueColumn: null };
              if (newOperation === 'revenue_loss') {
                newConfig.type = 'bar'; // Default to bar chart
              }
              setConfig(newConfig);
            }}
            className="w-full px-4 py-2 border rounded"
          >
            <option value="count">Count</option>
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
            <option value="revenue_loss">Revenue Loss</option>
          </select>
        </div>

        {config.operation !== 'count' && config.operation !== 'revenue_loss' && (
          <div>
            <label className="block text-sm font-medium mb-2">Value Column</label>
            <select
              value={config.valueColumn || ''}
              onChange={(e) => setConfig({ ...config, valueColumn: e.target.value || null })}
              className="w-full px-4 py-2 border rounded"
            >
              <option value="">Select column</option>
              {availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Filters</label>
          <div className="flex gap-2 mb-2">
            <select
              value={filterColumn}
              onChange={(e) => {
                setFilterColumn(e.target.value);
                setFilterValue('');
                setMultiFilterValues(new Set());
              }}
              className="w-full px-4 py-2 border rounded"
            >
              <option value="">Select column to filter by</option>
              {availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {filterColumn && (
            <div className="mb-2">
              {filterColumn === 'Status' ? (
                <div className="border p-2 rounded-md max-h-40 overflow-y-auto">
                  <label className="block text-sm font-medium mb-1">Select Statuses:</label>
                  {filterValueOptions.map((opt) => (
                    <div key={opt} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`filter-opt-${opt}`}
                        checked={multiFilterValues.has(opt)}
                        onChange={(e) => handleMultiFilterChange(opt, e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor={`filter-opt-${opt}`}>{opt}</label>
                    </div>
                  ))}
                </div>
              ) : (
                <select
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                >
                  <option value="">Select value</option>
                  {filterValueOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button onClick={handleAddFilter} className="w-full px-4 py-2 bg-blue-500 text-white rounded mb-2" disabled={!filterColumn}>
            Add Filter
          </button>
          
          <div className="flex flex-wrap gap-2">
            {Object.entries(config.filters).map(([key, value]) => (
              <span
                key={key}
                className="px-3 py-1 bg-gray-200 rounded flex items-center gap-2"
              >
                {key}: {Array.isArray(value) ? `[${value.join(', ')}]` : value}
                <button
                  onClick={() => handleRemoveFilter(key)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={handlePreview}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Preview
        </button>

        <div className="mt-4">
          <h4 className="font-medium mb-2">Preview</h4>
          {previewData?.warning && (
            <div className="mb-4 text-yellow-800 p-3 bg-yellow-200 border border-yellow-500 rounded-md">
              <strong>Warning:</strong> {previewData.warning}
            </div>
          )}
          {renderChart()}
                      {initialConfig ? (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => onSave && onSave(config)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => onCancel && onCancel()}
                          className="flex-1 px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAddWidget({ ...config, id: Date.now().toString() })}
                        className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Add to Dashboard
                      </button>
                    )}        </div>
      </div>
    </div>
  )
}

export default WidgetCreator
