import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import Widget from '../components/Widget'
import WidgetCreator from '../components/WidgetCreator'
import useAutoSave from '../hooks/useAutoSave'
import { useToast } from '../context/ToastContext'
import { dashboardService, dataService, fileService } from '../services/api'

function DashboardPage() {
  const navigate = useNavigate()
  const [widgets, setWidgets] = useState([])
  const [layout, setLayout] = useState([])
  const [showCreator, setShowCreator] = useState(false)
  const [editingWidget, setEditingWidget] = useState(null)
  const [openColumns, setOpenColumns] = useState([])
  const [releaseColumns, setReleaseColumns] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [savedDashboards, setSavedDashboards] = useState([])
  const [currentDashboardId, setCurrentDashboardId] = useState(null)
  const [dashboardName, setDashboardName] = useState('My Dashboard')
  const [showLoadMenu, setShowLoadMenu] = useState(false)
  const { saveStatus, save } = useAutoSave()
  const { showToast } = useToast()

  // measure available width for the grid so items can expand to full width
  const gridContainerRef = useRef(null)
  const [gridWidth, setGridWidth] = useState(0)

  useLayoutEffect(() => {
    const updateWidth = () => {
      const el = gridContainerRef.current
      if (el) setGridWidth(el.clientWidth)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [showCreator])

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      // Ensure backend loads any previously saved files into its in-memory cache
      // This will look at saved file records and attempt to load files from disk (uploads/)
      try {
        await fileService.refresh()
      } catch (e) {
        // ignore refresh errors; validation below will handle missing files
        console.warn('Refresh failed during initial load:', e)
      }
      // Validate files
      const openValidation = await fileService.validateFile('open')
      const releaseValidation = await fileService.validateFile('release')

      if (!openValidation.data.exists || !releaseValidation.data.exists) {
        navigate('/')
        return
      }

      setOpenColumns(openValidation.data.columns || [])
      setReleaseColumns(releaseValidation.data.columns || [])

      // Load statistics
      const statsResponse = await dataService.getStatistics()
      setStatistics(statsResponse.data)

      // Load saved dashboards and, if present, load the most recently updated one.
      try {
        const dashboardsResp = await dashboardService.list()
        const dashboards = dashboardsResp.data || []
        setSavedDashboards(dashboards)
        if (dashboards.length > 0) {
          // dashboards are returned sorted by updatedAt desc by the backend
          const first = dashboards[0]
          await handleLoadDashboard(first.id)
          return
        }
      } catch (e) {
        console.warn('Failed to load saved dashboards during initial load', e)
      }

      // No saved dashboards found: create defaults
      createDefaultWidgets(statsResponse.data, openValidation.data.columns)
    } catch (err) {
      console.error('Error loading initial data:', err)
      alert('Error loading data. Please ensure files are loaded.')
      navigate('/')
    }
  }

  const createDefaultWidgets = (stats, columns) => {
    // Only create the two chart widgets by default. Removing the two numeric
    // summary widgets which previously appeared empty for some datasets.
    const defaultWidgets = [
      {
        id: 'location-dist',
        type: 'pie',
        dataSource: 'open',
        groupBy: ['Location'],
        operation: 'count',
        filters: {},
      },
    ]

    setWidgets(defaultWidgets)
    setLayout(
      defaultWidgets.map((w, i) => ({
        i: w.id,
        x: (i % 2) * 6,
        y: Math.floor(i / 2) * 4,
        w: 6,
        h: 4,
      }))
    )
    setCurrentDashboardId(null)
  }

  const handleAddWidget = (widgetConfig) => {
    const newWidget = { ...widgetConfig, id: Date.now().toString() }
    setWidgets([...widgets, newWidget])
    setLayout([
      ...layout,
      {
        i: newWidget.id,
        x: (layout.length % 2) * 6,
        y: Math.floor(layout.length / 2) * 4,
        w: 6,
        h: 4,
      },
    ])
    setShowCreator(false)
  }

  const handleRemoveWidget = (id) => {
    setWidgets(widgets.filter((w) => w.id !== id))
    setLayout(layout.filter((l) => l.i !== id))
  }

  const handleSaveDashboard = async (widgetsToSave) => {
    if (!dashboardName.trim()) {
      alert('Please enter a dashboard name')
      return
    }

    // Prevent accidental overwrite: if the user has changed the name, we should
    // create a new dashboard instead of overwriting an existing one. Only allow
    // updating the currently-loaded dashboard when the name matches that dashboard's
    // existing name. If a different saved dashboard already uses the requested name,
    // block the save and ask the user to choose a different name or explicitly load
    // the existing dashboard to update it.
    const dup = savedDashboards.find((d) => d.name && d.name.trim().toLowerCase() === dashboardName.trim().toLowerCase())
    const loaded = savedDashboards.find((d) => d.id === currentDashboardId)
    const loadedName = loaded?.name
    const isUpdatingLoaded = currentDashboardId && loadedName && loadedName.trim().toLowerCase() === dashboardName.trim().toLowerCase()

    if (dup && dup.id !== currentDashboardId) {
      alert('A dashboard with this name already exists. Choose a different name to save a new dashboard, or load the existing dashboard to update it.')
      return
    }

    const layoutMap = {}
    layout.forEach((l) => {
      layoutMap[l.i] = JSON.stringify(l)
    })

    // If the handler was invoked as an event handler (onClick passes the event),
    // ensure we don't treat the event object as the widgets array. Only accept
    // actual arrays here; otherwise fall back to current `widgets` state.
    const widgetsPayload = Array.isArray(widgetsToSave) ? widgetsToSave : widgets

    try {
      // Only update an existing dashboard when the name matches the loaded dashboard.
      // If the user changed the name, create a new dashboard (saveId === null).
      const saveId = isUpdatingLoaded ? currentDashboardId : null
      // sanitize widgets to avoid circular references (DOM/React internals)
      const widgetsToSend = (widgetsPayload || []).map((w) => ({
        id: w?.id,
        type: w?.type,
        dataSource: w?.dataSource,
        columns: w?.columns || null,
        groupBy: w?.groupBy || [],
        operation: w?.operation,
        valueColumn: w?.valueColumn || null,
        filters: w?.filters || {},
        options: w?.options || null,
        title: w?.title || null,
      }))

      const payload = {
        ...(saveId ? { id: saveId } : {}),
        name: dashboardName,
        user: 'admin',
        layout: layoutMap,
        widgets: widgetsToSend,
      }

      // payload prepared for saving
      const res = await save(() => dashboardService.save(payload), { successMessage: 'Dashboard saved' })
      // update local state to reflect what was actually saved
      try {
        const saved = res?.data || res
        if (saved) {
          setCurrentDashboardId(saved.id)
          setDashboardName(saved.name || dashboardName)
          if (saved.widgets) setWidgets(saved.widgets)
          if (saved.layout) {
            const loadedLayout = []
            Object.entries(saved.layout).forEach(([key, value]) => {
              loadedLayout.push({ ...JSON.parse(value), i: key })
            })
            setLayout(loadedLayout)
          }
        }
      } catch (e) {
        console.warn('Could not apply saved dashboard response to local state', e)
      }
      await loadSavedDashboards()
    } catch (err) {
      console.error('Error saving dashboard:', err)
      alert('Failed to save dashboard: ' + (err?.response?.data?.message || err?.message || String(err)))
    }
  }

  const loadSavedDashboards = async () => {
    try {
      const response = await dashboardService.list()
      setSavedDashboards(response.data)
    } catch (err) {
      console.error('Error loading dashboards:', err)
    }
  }

  const handleLoadDashboard = async (id) => {
    try {
      const response = await dashboardService.get(id)
      const dashboard = response.data

      setDashboardName(dashboard.name)
      setCurrentDashboardId(dashboard.id)
      setWidgets(dashboard.widgets || [])

      const loadedLayout = []
      if (dashboard.layout) {
        Object.entries(dashboard.layout).forEach(([key, value]) => {
          loadedLayout.push({ ...JSON.parse(value), i: key })
        })
      }
      setLayout(loadedLayout)
      setShowLoadMenu(false)
    } catch (err) {
      console.error('Error loading dashboard:', err)
      alert('Failed to load dashboard: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleDeleteDashboard = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dashboard?')) {
      return
    }

    try {
      await dashboardService.delete(id)
      loadSavedDashboards()
      if (savedDashboards.length === 1) {
        // Reset to default if last dashboard was deleted
        createDefaultWidgets(statistics, openColumns)
        setDashboardName('My Dashboard')
      }
    } catch (err) {
      console.error('Error deleting dashboard:', err)
      alert('Failed to delete dashboard')
    }
  }

  const handleRefresh = async () => {
    if (!window.confirm('Refresh will reload all data from files. Continue?')) {
      return
    }

    try {
      await fileService.refresh()
      // After refresh, reload the currently selected dashboard if any,
      // otherwise re-run the initial data load to refresh columns and stats.
      if (currentDashboardId) {
        try {
          await handleLoadDashboard(currentDashboardId)
        } catch (e) {
          console.warn('Failed to reload current dashboard after refresh', e)
          // fallback to initial load
          await loadInitialData()
        }
      } else {
        await loadInitialData()
      }
      try {
        showToast({ status: 'success', message: 'Data refreshed' })
      } catch (e) {
        // fallback to alert if toast not available
        alert('Data refreshed!')
      }
    } catch (err) {
      console.error('Error refreshing:', err)
      alert('Failed to refresh data: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout)
  }

  // push saveStatus into global toast when it changes
  useEffect(() => {
    if (saveStatus && saveStatus.status && saveStatus.status !== 'idle') {
      showToast({ status: saveStatus.status, message: saveStatus.message })
    }
  }, [saveStatus, showToast])

  

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex gap-2">
              <input
                type="text"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="Dashboard Name"
                className="px-4 py-2 border rounded"
              />
              <div className="relative">
                <button
                  onClick={() => setShowLoadMenu(!showLoadMenu)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Load Dashboard
                </button>
                {showLoadMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg z-10 max-h-64 overflow-y-auto">
                    {savedDashboards.length === 0 ? (
                      <div className="p-4 text-gray-500">No saved dashboards</div>
                    ) : (
                      savedDashboards.map((dashboard) => (
                        <div
                          key={dashboard.id}
                          className="p-3 border-b hover:bg-gray-100 flex justify-between items-center"
                        >
                          <button
                            onClick={() => handleLoadDashboard(dashboard.id)}
                            className="flex-1 text-left"
                          >
                            {dashboard.name}
                          </button>
                          <button
                            onClick={() => handleDeleteDashboard(dashboard.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleSaveDashboard()}
                disabled={saveStatus.status === 'saving'}
                aria-busy={saveStatus.status === 'saving'}
                className={`px-4 py-2 rounded text-white flex items-center gap-2 ${saveStatus.status === 'saving' ? 'bg-green-400 opacity-80 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {saveStatus.status === 'saving' && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                )}
                {saveStatus.status === 'success' && (
                  <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L8 11.172 4.707 7.879a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{saveStatus.status === 'saving' ? 'Saving...' : saveStatus.status === 'success' ? 'Saved' : 'Save Dashboard'}</span>
              </button>
              <button
                onClick={() => {
                  if (showCreator) {
                    setShowCreator(false)
                    setEditingWidget(null)
                  } else {
                    setEditingWidget(null)
                    setShowCreator(true)
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {showCreator ? 'Hide Creator' : 'Create Widget'}
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
              {showCreator && (
            <div className="w-80 flex-shrink-0">
              <WidgetCreator
                onAddWidget={handleAddWidget}
                openColumns={openColumns}
                releaseColumns={releaseColumns}
                initialConfig={editingWidget}
                onSave={(updated) => {
                  // update widget in-place and save using the updated array immediately
                  setWidgets((prev) => {
                    const updatedArr = prev.map((w) => (w.id === updated.id ? updated : w))
                    // auto-save dashboard after editing widget
                    handleSaveDashboard(updatedArr)
                    return updatedArr
                  })
                  setEditingWidget(null)
                  setShowCreator(false)
                }}
                onCancel={() => {
                  setEditingWidget(null)
                  setShowCreator(false)
                }}
              />
            </div>
          )}

          <div className="flex-1" ref={gridContainerRef}>
            {widgets.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 mb-4">No widgets yet. Create one to get started!</p>
                <button
                  onClick={() => {
                    setEditingWidget(null)
                    setShowCreator(true)
                  }}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create Widget
                </button>
              </div>
            ) : (
              <GridLayout
                className="layout"
                layout={layout}
                cols={12}
                rowHeight={60}
                width={gridWidth || 1200}
                onLayoutChange={handleLayoutChange}
                isDraggable={true}
                isResizable={true}
                draggableHandle=".widget-header"
              >
                {widgets.map((widget) => (
                  <div key={widget.id}>
                          <Widget
                            config={widget}
                            onRemove={() => handleRemoveWidget(widget.id)}
                            onEdit={() => {
                              setEditingWidget(widget)
                              setShowCreator(true)
                            }}
                            onUpdate={(updatedWidget) => {
                              // update widget in state and save using the updated array immediately
                              setWidgets((prev) => {
                                const updatedArr = prev.map((w) => (w.id === updatedWidget.id ? updatedWidget : w))
                                handleSaveDashboard(updatedArr)
                                return updatedArr
                              })
                            }}
                          />
                  </div>
                ))}
              </GridLayout>
            )}
          </div>
        </div>
      </div>
    
    </div>
  )
}

export default DashboardPage

