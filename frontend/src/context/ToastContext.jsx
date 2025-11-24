import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import Toast from '../components/Toast'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ status: 'idle', message: '' })
  const showToast = useCallback(({ status, message }) => setToast({ status, message }), [])
  const dismiss = useCallback(() => setToast({ status: 'idle', message: '' }), [])

  // auto-dismiss handled in Toast component or here; keep provider simple
  return (
    <ToastContext.Provider value={{ showToast, dismiss, toast }}>
      {children}
      <Toast status={toast.status} message={toast.message} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

export default ToastContext
