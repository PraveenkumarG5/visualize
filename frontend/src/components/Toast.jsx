import { useEffect } from 'react'

function Toast({ status = 'idle', message = '', onDismiss }) {
  // Auto-hide behavior: success -> 2.5s, error -> 8s
  useEffect(() => {
    let t
    if (status === 'success') {
      t = setTimeout(() => onDismiss && onDismiss(), 2500)
    } else if (status === 'error') {
      t = setTimeout(() => onDismiss && onDismiss(), 8000)
    }
    return () => clearTimeout(t)
  }, [status, onDismiss])

  if (!status || status === 'idle') return null

  return (
    <div aria-live="polite" className="fixed bottom-6 right-6 z-50">
      <div
        className={`max-w-sm w-full bg-white border rounded shadow-lg px-4 py-3 flex items-center gap-3 ${status === 'error' ? 'border-red-300' : 'border-green-200'}`}
      >
        {status === 'saving' && (
          <svg className="animate-spin h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        )}
        {status === 'success' && (
          <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L8 11.172 4.707 7.879a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
          </svg>
        )}
        {status === 'error' && (
          <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.68-1.36 3.445 0l6.518 11.591c.75 1.334-.213 3.01-1.722 3.01H3.46c-1.51 0-2.472-1.676-1.722-3.01L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-.993.883L9 6v4a1 1 0 001.993.117L11 10V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
        <div className="text-sm text-gray-700">{message}</div>
        {status === 'error' && (
          <button onClick={() => onDismiss && onDismiss()} className="ml-2 text-sm text-gray-500 hover:text-gray-700">Dismiss</button>
        )}
      </div>
    </div>
  )
}

export default Toast
