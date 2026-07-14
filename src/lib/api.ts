// Cliente HTTP del portal. En dev, /api se redirige al backend vía proxy de Vite.
const BASE = import.meta.env.VITE_API_URL ?? '/api'

const TOKEN_KEY = 'mantelek_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function parse(res: Response) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? `Error ${res.status}`)
  }
  return body
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getToken()
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra
}

export const api = {
  get: <T>(path: string): Promise<T> =>
    fetch(`${BASE}${path}`, { headers: authHeaders() }).then(parse),

  post: <T>(path: string, body?: unknown): Promise<T> =>
    fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: body ? JSON.stringify(body) : undefined,
    }).then(parse),

  put: <T>(path: string, body?: unknown): Promise<T> =>
    fetch(`${BASE}${path}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: body ? JSON.stringify(body) : undefined,
    }).then(parse),

  patch: <T>(path: string, body?: unknown): Promise<T> =>
    fetch(`${BASE}${path}`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: body ? JSON.stringify(body) : undefined,
    }).then(parse),

  del: <T>(path: string): Promise<T> =>
    fetch(`${BASE}${path}`, { method: 'DELETE', headers: authHeaders() }).then(parse),

  /** Subida multipart de un archivo (campo "file"). */
  upload: <T>(path: string, file: File): Promise<T> => {
    const form = new FormData()
    form.append('file', file)
    return fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    }).then(parse)
  },

  /** Descarga un recurso protegido como blob y dispara el guardado en el navegador. */
  async download(path: string, fallbackName = 'descarga') {
    const res = await fetch(`${BASE}${path}`, { headers: authHeaders() })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ApiError(res.status, body.error ?? `Error ${res.status}`)
    }
    const disposition = res.headers.get('Content-Disposition') ?? ''
    const match = disposition.match(/filename="?([^"]+)"?/)
    const name = match?.[1] ?? fallbackName
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
}
