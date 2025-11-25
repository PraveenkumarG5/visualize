import { useState, useEffect, useCallback, useRef } from 'react'
import hash from 'object-hash'

// useAutoSave: manage a save status state and provide a `save` helper that
// wraps any async save function. Returns { saveStatus, save, dismiss }
// save(asyncFn, { successMessage, errorMessage }) -> returns the resolved value or throws.
export default function useAutoSave(debounceMs = 800) {
  const [saveStatus, setSaveStatus] = useState({ status: 'idle', message: '' })
  const timerRef = useRef(null)
  // Use a stable hash function that is less sensitive to internal object properties
  // that might change during editing but don't represent a change in value.
  const stableHash = (value) => hash(value, { respectType: false })

  const lastFnRef = useRef(null)
  const pendingRefs = useRef([])

  const dismiss = useCallback(() => setSaveStatus({ status: 'idle', message: '' }), [])

  const runNow = useCallback(async (asyncFn, { successMessage = 'Saved', errorPrefix = 'Failed to save: ' } = {}) => {
    setSaveStatus({ status: 'saving', message: 'Saving...' })
    try {
      const res = await asyncFn()
      setSaveStatus({ status: 'success', message: successMessage })
      return res
    } catch (err) {
      const msg = (err?.response?.data?.message) || err?.message || String(err)
      setSaveStatus({ status: 'error', message: errorPrefix + msg })
      throw err
    }
  }, [])

  const flush = useCallback(async ({ successMessage, errorPrefix } = {}) => {
    if (!lastFnRef.current) return
    const fn = lastFnRef.current
    // clear refs before running to allow new saves to be scheduled
    lastFnRef.current = null
    timerRef.current = null

    try {
      const res = await runNow(fn, { successMessage, errorPrefix })
      // resolve all pending promises
      pendingRefs.current.forEach(({ resolve }) => resolve(res))
    } catch (err) {
      pendingRefs.current.forEach(({ reject }) => reject(err))
    } finally {
      pendingRefs.current = []
    }
  }, [runNow])

  const save = useCallback((asyncFn, { successMessage = 'Saved', errorPrefix = 'Failed to save: ' } = {}) => {
    if (!debounceMs || debounceMs <= 0) {
      return runNow(asyncFn, { successMessage, errorPrefix })
    }

    // schedule debounced save: keep last asyncFn and batch callers
    lastFnRef.current = asyncFn
    return new Promise((resolve, reject) => {
      pendingRefs.current.push({ resolve, reject })
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        flush({ successMessage, errorPrefix }).catch(() => {})
      }, debounceMs)
    })
  }, [debounceMs, flush, runNow])

  // auto-dismiss behavior for success and error statuses
  useEffect(() => {
    let t
    if (saveStatus.status === 'success') {
      t = setTimeout(() => setSaveStatus({ status: 'idle', message: '' }), 2500)
    } else if (saveStatus.status === 'error') {
      t = setTimeout(() => setSaveStatus({ status: 'idle', message: '' }), 8000)
    }
    return () => clearTimeout(t)
  }, [saveStatus.status])

  return { saveStatus, save, dismiss }
}
