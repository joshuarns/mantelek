import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * GET tipado con estado de carga/error y refetch. Si el token expiró (401)
 * cierra la sesión automáticamente.
 */
export function useFetch<T>(path: string | null): FetchState<T> {
  const { logout } = useAuth()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!path) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .get<T>(path)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) logout()
        setError(err instanceof Error ? err.message : 'Error desconocido')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [path, tick, logout])

  return { data, loading, error, refetch }
}
