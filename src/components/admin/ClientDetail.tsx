import { useEffect, useState } from 'react'
import { Loader2, Save, X } from 'lucide-react'
import { StatusBadge } from '../ui/StatusBadge'
import { ProgressBar } from '../ui/Progress'
import { Loading } from '../ui/States'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { AdminClient, HistoryItem } from '../../lib/apiTypes'

/** Ficha del cliente: historial mensual + observaciones internas (Módulo 7). */
export function ClientDetail({
  client,
  onClose,
}: {
  client: AdminClient
  onClose: () => void
}) {
  const records = useFetch<HistoryItem[]>(`/admin/clients/${client.id}/records`)
  const notes = useFetch<{ notes: string }>(`/admin/clients/${client.id}/notes`)

  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (notes.data) setText(notes.data.notes)
  }, [notes.data])

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await api.patch(`/admin/clients/${client.id}/notes`, { notes: text })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{client.name}</h2>
            <p className="text-xs text-slate-500">
              {client.personType === 'moral' ? 'Persona Moral' : 'Persona Física'} · {client.rfc}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Historial mensual */}
        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Historial mensual
        </p>
        {records.loading ? (
          <Loading label="Cargando historial…" />
        ) : (records.data ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">
            Todavía no tiene expedientes. Se generará al entrar al portal.
          </p>
        ) : (
          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2 font-medium">Mes</th>
                  <th className="px-4 py-2 font-medium">Estatus</th>
                  <th className="px-4 py-2 font-medium">Avance</th>
                  <th className="px-4 py-2 font-medium">Cumplido el</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(records.data ?? []).map((r) => (
                  <tr key={r.period}>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{r.label}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={r.progress} className="w-16" />
                        <span className="text-xs text-slate-600">{r.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{formatDate(r.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Observaciones internas */}
        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Observaciones internas
        </p>
        <p className="text-xs text-slate-400">
          Solo las ve el personal de Mantelek. El cliente nunca las verá.
        </p>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setSaved(false)
          }}
          rows={4}
          placeholder="Notas del área administrativa: acuerdos, incidencias, seguimiento…"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex items-center justify-end gap-2">
          {saved && <span className="text-sm text-emerald-600">Guardado ✓</span>}
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cerrar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Guardar observaciones
          </button>
        </div>
      </div>
    </div>
  )
}
