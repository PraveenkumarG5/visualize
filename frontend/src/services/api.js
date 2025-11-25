import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const fileService = {
  selectFolder: (path) => api.post('/files/select', { path }),
  uploadFiles: (openFile, releaseFile) => {
    const formData = new FormData()
    formData.append('openFile', openFile)
    formData.append('releaseFile', releaseFile)
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  validateFile: (type) => api.get('/files/validate', { params: { type } }),
  refresh: () => api.post('/files/refresh'),
}

export const dataService = {
  getSampleData: (type, limit = 50) =>
    api.get('/data/sample', { params: { type, limit } }),
  getStatistics: () => api.get('/data/statistics'),
  aggregate: (request) => api.post('/data/aggregate', request),
  getUniqueValues: (type, column) => api.get('/data/unique-values', { params: { type, column } }),
}

export const widgetService = {
  preview: (config) => api.post('/widgets/preview', config),
}

export const dashboardService = {
  save: (dashboard) => api.post('/dashboards', dashboard),
  list: () => api.get('/dashboards'),
  get: (id) => api.get(`/dashboards/${id}`),
  delete: (id) => api.delete(`/dashboards/${id}`),
}

export default api

