import { useEffect, useState } from 'react'
import { CheckCircle2, Download, FolderTree, Info, Loader2 } from 'lucide-react'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../lib/api'
import { requiredDocuments } from '../../lib/documents'
import type { AdminClient } from '../../lib/apiTypes'

const TABS = ['Por Cliente', 'Por Mes', 'Por Cliente y Mes', 'Varios Clientes']

const PERIODS = [
  { value: '2026-07', label: 'Julio 2026' },
  { value: '2026-06', label: 'Junio 2026' },
  { value: '2026-05', label: 'Mayo 2026' },
  { value: '', label: 'Todos los periodos' },
]

export function Descargas() {
  const { data, loading, error, refetch } = useFetch<AdminClient[]>('/admin/clients')
  const [tab, setTab] = useState(0)
  const [clientId, setClientId] = useState('')
  const [period, setPeriod] = useState('2026-07')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  useEffect(() => {
    if (data && data.length && !clientId) setClientId(data[0].id)
  }, [data, clientId])

  if (loading) return <Loading />
  if (error || !data)
    return <ErrorState message={error ?? 'No se pudo cargar'} onRetry={refetch} />

  const selected = data.find((c) => c.id === clientId) ?? data[0]
  const includes = selected ? requiredDocuments(selected.personType) : []

  async function generate() {
    setGenerating(true)
    setGenError(null)
    setResult(null)
    const params = new URLSearchParams()
    if (clientId) params.set('clientId', clientId)
    if (period) params.set('period', period)
    try {
      await api.download(`/admin/download?${params}`, 'Mantelek_Documentos.zip')
      setResult(
        `${selected?.name.replace(/ /g, '_')}${period ? `_${period.replace('-', '_')}` : ''}.zip`,
      )
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'No se pudo generar la descarga')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Descarga de Documentación</h1>
      <p className="mt-1 text-sm text-slate-500">
        Genera un paquete .zip con la documentación de tus clientes organizada por carpetas.
      </p>

      <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => {
              setTab(i)
              setResult(null)
            }}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === i
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Selecciona un cliente:</label>
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value)
                setResult(null)
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Selecciona el mes:</label>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value)
                setResult(null)
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {generating ? 'Generando…' : 'Generar descarga'}
          </button>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">La descarga incluirá:</p>
          <ul className="mt-2 space-y-1.5">
            {includes.map((d) => (
              <li key={d.type} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={15} className="text-emerald-500" />
                {d.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {genError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {genError}
        </div>
      )}

      {result && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold">Descarga generada correctamente.</p>
            <p className="text-emerald-700">Archivo: {result}</p>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 text-sm text-brand-700">
        <div className="flex items-center gap-2 font-medium">
          <Info size={16} /> Se generará un archivo .zip con la siguiente estructura:
        </div>
        <pre className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <FolderTree size={14} /> Cliente &gt; Año &gt; Mes &gt; Nombre del Documento
        </pre>
      </div>
    </div>
  )
}
