import { useEffect, useState, useRef } from 'react'
import { widgetService } from '../services/api'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

function Widget({ config, onRemove, onEdit, onUpdate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const titleInputRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [config])

  useEffect(() => {
    setTitleInput(config.title || '')
  }, [config.title])

  // focus the input when entering edit mode
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      // small timeout to ensure element is mounted and focusable
      setTimeout(() => {
        try {
          titleInputRef.current.focus()
          // move cursor to end
          const val = titleInputRef.current.value
          titleInputRef.current.setSelectionRange(val.length, val.length)
        } catch (e) {}
      }, 0)
    }
  }, [editingTitle])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = { ...config }
      if (config.type === 'number') {
        payload.groupBy = []
      }
      const response = await widgetService.preview(payload)
      setData(response.data)
    } catch (err) {
      console.error('Error loading widget data:', err)
      setError('Failed to load widget data')
    } finally {
      setLoading(false)
    }
  }

  const renderChart = () => {
    if (loading) return <div className="text-center py-8">Loading...</div>
    if (error) return <div className="text-center py-8 text-red-500">{error}</div>
    if (!data || !data.labels || data.labels.length === 0) {
      return <div className="text-center py-8 text-gray-500">No data</div>
    }

    const chartData = data.labels.map((label, index) => ({
      name: label,
      value: data.values[index],
    }))

    switch (config.type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={70}
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
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'number':
        return (
          <div className="text-center py-8">
            <div className="text-4xl font-bold">{data.values && data.values[0] ? data.values[0] : (data.value || 0)}</div>
            <div className="text-gray-500 mt-2">{config.groupBy && config.groupBy[0] ? config.groupBy[0] : 'Total'}</div>
          </div>
        )
      default:
        return <div>Unsupported chart type</div>
    }
  }

  const handleRemove = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onRemove) {
      onRemove()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full">
      <div className="flex justify-between items-center mb-2 widget-header">
        <h4 className="font-semibold">
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={() => {
                setEditingTitle(false)
                if (onUpdate && (titleInput || '') !== (config.title || '')) {
                  onUpdate({ ...config, title: titleInput })
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.target.blur()
                } else if (e.key === 'Escape') {
                  setTitleInput(config.title || '')
                  setEditingTitle(false)
                }
              }}
              onMouseDown={(e) => { e.stopPropagation(); }}
              onTouchStart={(e) => { e.stopPropagation(); }}
              className="px-2 py-1 border rounded w-full"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation()
                setEditingTitle(true)
              }}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="cursor-pointer"
              title="Click to edit title"
            >
              {config.title && config.title.trim()
                ? config.title
                : (config.groupBy && config.groupBy[0] ? config.groupBy[0] : 'Widget')}
            </span>
          )}
        </h4>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEdit()
              }}
              onMouseDown={(e) => {
                // Prevent react-grid-layout from starting a drag on mousedown
                e.preventDefault()
                e.stopPropagation()
              }}
              onTouchStart={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
              title="Edit widget"
              type="button"
            >
              ✎
            </button>
          )}
          {onRemove && (
            <button
              onClick={handleRemove}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onTouchStart={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              className="text-red-500 hover:text-red-700 text-xl font-bold cursor-pointer z-10 relative"
              style={{ pointerEvents: 'auto' }}
              title="Remove widget"
              type="button"
            >
              ×
            </button>
          )}
        </div>
      </div>
      {renderChart()}
    </div>
  )
}

export default Widget

