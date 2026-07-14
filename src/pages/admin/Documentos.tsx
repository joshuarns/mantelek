import { useState } from 'react'
import { CheckCircle2, Download, FileText } from 'lucide-react'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../lib/api'
import { allDocuments } from '../../lib/documents'
import { formatDateTime, periodLabel } from '../../lib/format'
import { recentPeriods } from '../../lib/periods'
import type { AdminClient, AdminDocument } from '../../lib/apiTypes'

const DOC_TYPES = allDocuments()
const PERIODS = recentPeriods()

export function Documentos() {
  const clients = useFetch<AdminClient[]>('/admin/clients')

  const [clientId, setClientId] = useState('')
  const [period, setPeriod] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')

  const params = new URLSearchParams()
  if (clientId) params.set('clientId', clientId)
  if (period) params.set('period', period)
  if (type) params.set('type', type)
  if (status) params.set('status', status)

  const { data, loading, error, refetch } = useFetch<AdminDocument[]>(
    `/admin/documents?${params}`,
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Explorador de todos los expedientes. Encuentra y descarga cualquier documento sin
          buscar en correos ni carpetas compartidas.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Cliente</span>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {(clients.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Mes</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {periodLabel(p)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Documento</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {DOC_TYPES.map((d) => (
              <option key={d.type} value={d.type}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Estatus</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            <option value="cargado">Cargado</option>
            <option value="pendiente">Pendiente</option>
          </select>
        </label>
      </div>

      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error ?? 'No se pudo cargar'} onRetry={refetch} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{data.length}</span> documento
            {data.length !== 1 && 's'}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Mes</th>
                  <th className="px-5 py-3 font-medium">Documento</th>
                  <th className="px-5 py-3 font-medium">Carga</th>
                  <th className="px-5 py-3 font-medium">Cargado por</th>
                  <th className="px-5 py-3 text-right font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{d.clientName}</td>
                    <td className="px-5 py-3 text-slate-600">{d.periodLabel}</td>
                    <td className="px-5 py-3">
                      <p className="text-slate-800">{d.label}</p>
                      {d.fileName && (
                        <p className="text-xs text-slate-400">
                          {d.fileName} · {d.fileSize}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {d.status === 'cargado' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 size={14} />
                          {formatDateTime(d.uploadedAt)}
                        </span>
                      ) : (
                        <span className="font-medium text-amber-600">Pendiente</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{d.uploadedBy ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      {d.status === 'cargado' && (
                        <button
                          onClick={() =>
                            api.download(`/documents/${d.id}/download`, d.fileName ?? 'documento')
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Download size={14} /> Descargar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <FileText size={24} className="mx-auto text-slate-300" />
                      <p className="mt-2 text-sm text-slate-400">
                        No hay documentos que coincidan con los filtros.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
