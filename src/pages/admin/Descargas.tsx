import { useEffect, useState } from 'react'
import { CheckCircle2, Download, FolderTree, Info, Loader2 } from 'lucide-react'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../lib/api'
import { allDocuments } from '../../lib/documents'
import { periodLabel } from '../../lib/format'
import type { AdminClient } from '../../lib/apiTypes'

type Mode = 'cliente' | 'mes' | 'cliente_mes' | 'varios'

const TABS: { id: Mode; label: string }[] = [
  { id: 'cliente', label: 'Por Cliente' },
  { id: 'mes', label: 'Por Mes' },
  { id: 'cliente_mes', label: 'Por Cliente y Mes' },
  { id: 'varios', label: 'Varios Clientes' },
]

/** Últimos 12 periodos, del más reciente al más antiguo. */
function recentPeriods(): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

const DOC_TYPES = allDocuments()
const PERIODS = recentPeriods()

export function Descargas() {
  const { data, loading, error, refetch } = useFetch<AdminClient[]>('/admin/clients')

  const [mode, setMode] = useState<Mode>('cliente')
  const [clientId, setClientId] = useState('')
  const [manyIds, setManyIds] = useState<string[]>([])
  const [period, setPeriod] = useState(PERIODS[0])
  const [types, setTypes] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  useEffect(() => {
    if (data?.length && !clientId) setClientId(data[0].id)
  }, [data, clientId])

  if (loading) return <Loading />
  if (error || !data)
    return <ErrorState message={error ?? 'No se pudo cargar'} onRetry={refetch} />

  if (data.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900">Descarga de Documentación</h1>
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="font-medium text-slate-700">Aún no hay clientes</p>
          <p className="mt-1 text-sm text-slate-500">
            Da de alta clientes para poder descargar su documentación.
          </p>
        </div>
      </div>
    )
  }

  const usesClient = mode === 'cliente' || mode === 'cliente_mes'
  const usesPeriod = mode === 'mes' || mode === 'cliente_mes' || mode === 'varios'
  const usesMany = mode === 'varios'

  function reset() {
    setResult(null)
    setGenError(null)
  }

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
    reset()
  }

  async function generate() {
    setGenerating(true)
    reset()

    const params = new URLSearchParams()
    if (usesClient && clientId) params.set('clientId', clientId)
    if (usesMany && manyIds.length) params.set('clientIds', manyIds.join(','))
    if (usesPeriod && period) params.set('period', period)
    if (types.length) params.set('types', types.join(','))

    try {
      await api.download(`/admin/download?${params}`, 'Mantelek_Documentos.zip')
      setResult('El paquete .zip se descargó correctamente.')
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'No se pudo generar la descarga')
    } finally {
      setGenerating(false)
    }
  }

  const disabled = generating || (usesMany && manyIds.length === 0)

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Descarga de Documentación</h1>
      <p className="mt-1 text-sm text-slate-500">
        Genera un paquete .zip con la documentación organizada por carpetas, listo para una
        auditoría o un requerimiento del SAT.
      </p>

      <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setMode(t.id)
              reset()
            }}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              mode === t.id
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        {usesClient && (
          <div>
            <label className="text-sm font-medium text-slate-700">Cliente</label>
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value)
                reset()
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {mode === 'cliente' && (
              <p className="mt-1 text-xs text-slate-400">
                Se incluirán todos sus periodos disponibles.
              </p>
            )}
          </div>
        )}

        {usesMany && (
          <div>
            <label className="text-sm font-medium text-slate-700">
              Clientes ({manyIds.length} seleccionados)
            </label>
            <div className="mt-1 max-h-52 space-y-1 overflow-y-auto rounded-lg border border-slate-300 p-2">
              {data.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={manyIds.includes(c.id)}
                    onChange={() => toggle(manyIds, c.id, setManyIds)}
                    className="rounded border-slate-300"
                  />
                  <span className="text-slate-700">{c.name}</span>
                </label>
              ))}
            </div>
            <button
              onClick={() => {
                setManyIds(manyIds.length === data.length ? [] : data.map((c) => c.id))
                reset()
              }}
              className="mt-1 text-xs font-medium text-brand-600 hover:underline"
            >
              {manyIds.length === data.length ? 'Quitar todos' : 'Seleccionar todos'}
            </button>
          </div>
        )}

        {usesPeriod && (
          <div>
            <label className="text-sm font-medium text-slate-700">Mes</label>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value)
                reset()
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {periodLabel(p)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-slate-700">
            Tipo de documento{' '}
            <span className="font-normal text-slate-400">
              ({types.length === 0 ? 'todos' : `${types.length} seleccionados`})
            </span>
          </label>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {DOC_TYPES.map((d) => (
              <label
                key={d.type}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={types.includes(d.type)}
                  onChange={() => toggle(types, d.type, setTypes)}
                  className="rounded border-slate-300"
                />
                <span className="text-slate-600">{d.label}</span>
              </label>
            ))}
          </div>
          {types.length > 0 && (
            <button
              onClick={() => {
                setTypes([])
                reset()
              }}
              className="mt-1 text-xs font-medium text-brand-600 hover:underline"
            >
              Incluir todos los tipos
            </button>
          )}
        </div>

        <button
          onClick={generate}
          disabled={disabled}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {generating ? 'Generando…' : 'Generar descarga'}
        </button>
        {usesMany && manyIds.length === 0 && (
          <p className="-mt-3 text-center text-xs text-slate-400">
            Selecciona al menos un cliente.
          </p>
        )}
      </div>

      {genError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {genError}
        </div>
      )}

      {result && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
          <p className="font-semibold">{result}</p>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 text-sm text-brand-700">
        <div className="flex items-center gap-2 font-medium">
          <Info size={16} /> Estructura del archivo .zip:
        </div>
        <pre className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <FolderTree size={14} /> Cliente &gt; Año &gt; Mes &gt; Nombre del Documento
        </pre>
      </div>
    </div>
  )
}
