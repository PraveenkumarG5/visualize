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
  })
  const [previewData, setPreviewData] = useState(null)
  const [availableColumns, setAvailableColumns] = useState([])
  const [filterColumn, setFilterColumn] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [filterValueOptions, setFilterValueOptions] = useState([])
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false)
  const [numericColumns, setNumericColumns] = useState([])

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
      })
      setIsTitleManuallyEdited(!!initialConfig.title)
    }
  }, [initialConfig])

  useEffect(() => {
    if (isTitleManuallyEdited) return;

    const generateTitle = () => {
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

      const dataSourceText = config.dataSource === 'open' ? 'Open Requirements' : 'Release List';
      titleParts.push(`from ${dataSourceText}`);

      const filterDetails = Object.entries(config.filters)
        .map(([key, value]) => `${key}: '${value}'`)
        .join(', ');

      if (filterDetails) {
        titleParts.push(`(filtered by ${filterDetails})`);
      }

      return titleParts.join(' ');
    };

    const newTitle = generateTitle();
    if (newTitle && newTitle !== config.title) {
        setConfig(prevConfig => ({ ...prevConfig, title: newTitle }));
    }
  }, [config.dataSource, config.groupBy, config.operation, config.valueColumn, config.filters, config.type, isTitleManuallyEdited, config.title]);

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
    if (filterColumn && filterValue) {
      setConfig({
        ...config,
        filters: { ...config.filters, [filterColumn]: filterValue },
      })
      setFilterColumn('')
      setFilterValue('')
    }
  }

  const handleRemoveFilter = (key) => {
    const newFilters = { ...config.filters }
    delete newFilters[key]
    setConfig({ ...config, filters: newFilters })
  }

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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'number':
        return (
          <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-800">
                {previewData.values[0]}
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
              setConfig({ ...config, title: e.target.value })
              setIsTitleManuallyEdited(e.target.value.length > 0)
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

        <div>
          <label className="block text-sm font-medium mb-2">Operation</label>
          <select
            value={config.operation}
            onChange={(e) => setConfig({ ...config, operation: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          >
            <option value="count">Count</option>
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
          </select>
        </div>

        {config.operation !== 'count' && (
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
                setFilterColumn(e.target.value)
                setFilterValue('')
              }}
              className="flex-1 px-4 py-2 border rounded"
            >
              <option value="">Select column</option>
              {availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            {filterColumn ? (
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="flex-1 px-4 py-2 border rounded"
              >
                <option value="">Select value</option>
                {filterValueOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={filterValue}
                placeholder="Value"
                className="flex-1 px-4 py-2 border rounded"
                disabled
              />
            )}
            <button
              onClick={handleAddFilter}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(config.filters).map(([key, value]) => (
              <span
                key={key}
                className="px-3 py-1 bg-gray-200 rounded flex items-center gap-2"
              >
                {key}: {value}
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
          {renderChart()}
          {initialConfig ? (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => onSave && onSave({ ...config, id: initialConfig.id })}
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
          )}
        </div>
      </div>
    </div>
  )
}

export default WidgetCreator
