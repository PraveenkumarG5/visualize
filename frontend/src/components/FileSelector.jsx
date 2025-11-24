import { useState } from 'react'
import { fileService } from '../services/api'

function FileSelector({ onFilesLoaded }) {
  const [folderPath, setFolderPath] = useState('')
  const [openFile, setOpenFile] = useState(null)
  const [releaseFile, setReleaseFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('upload') // 'upload' or 'path'

  const handlePathSelect = async () => {
    if (!folderPath.trim()) {
      setError('Please enter a folder path')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fileService.selectFolder(folderPath)
      if (response.data.success) {
        onFilesLoaded()
      } else {
        setError(response.data.errors?.join(', ') || 'Failed to load files')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!openFile || !releaseFile) {
      setError('Please select both files')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fileService.uploadFiles(openFile, releaseFile)
      if (response.data.success) {
        onFilesLoaded()
      } else {
        setError(response.data.errors?.join(', ') || 'Failed to upload files')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload files')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Load Excel Files</h2>

      <div className="mb-4">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setMode('upload')}
            className={`px-4 py-2 rounded ${mode === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Upload Files
          </button>
          <button
            onClick={() => setMode('path')}
            className={`px-4 py-2 rounded ${mode === 'path' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Select Folder Path
          </button>
        </div>
      </div>

      {mode === 'path' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Folder Path (containing Open_Requirement_Data.xlsx and Employee_Release_Data.xlsx)
            </label>
            <input
              type="text"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder="C:\path\to\folder or /path/to/folder"
              className="w-full px-4 py-2 border rounded"
            />
          </div>
          <button
            onClick={handlePathSelect}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Load Files'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Open Requirement Data (Open_Requirement_Data.xlsx)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setOpenFile(e.target.files[0])}
              className="w-full px-4 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Employee Release Data (Employee_Release_Data.xlsx)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setReleaseFile(e.target.files[0])}
              className="w-full px-4 py-2 border rounded"
            />
          </div>
          <button
            onClick={handleFileUpload}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  )
}

export default FileSelector

