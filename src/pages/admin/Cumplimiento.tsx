import { useState } from 'react'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ProgressBar } from '../../components/ui/Progress'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { allDocuments } from '../../lib/documents'
import { formatDate, periodLabel } from '../../lib/format'
import { recentPeriods } from '../../lib/periods'
import type { ComplianceResponse, ComplianceStatus, PersonType } from '../../lib/apiTypes'

const DOC_TYPES = allDocuments()
const PERIODS = recentPeriods()

export function Cumplimiento() {
  const [period, setPeriod] = useState(PERIODS[0])
  const [personType, setPersonType] = useState<PersonType | ''>('')
  const [status, setStatus] = useState<ComplianceStatus | ''>('')
  const [pendingType, setPendingType] = useState('')

  const params = new URLSearchParams({ period })
  if (personType) params.set('personType', personType)
  if (status) params.set('status', status)
  if (pendingType) params.set('pendingType', pendingType)

  const { data, loading, error, refetch } = useFetch<ComplianceResponse>(
    `/admin/compliance?${params}`,
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cumplimiento</h1>
        <p className="mt-1 text-sm text-slate-500">
          Vista consolidada de toda la cartera para un periodo, con el detalle de lo que le falta
          a cada cliente.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Mes</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {periodLabel(p)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Tipo de persona</span>
          <select
            value={personType}
            onChange={(e) => setPersonType(e.target.value as PersonType | '')}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            <option value="moral">Moral</option>
            <option value="fisica">Física</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">Estatus</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ComplianceStatus | '')}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            <option value="cumplido">Cumplido</option>
            <option value="en_proceso">En proceso</option>
            <option value="vencido">Vencido</option>
            <option value="sin_actividad">Sin actividad</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Le falta este documento
          </span>
          <select
            value={pendingType}
            onChange={(e) => setPendingType(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">Cualquiera</option>
            {DOC_TYPES.map((d) => (
              <option key={d.type} value={d.type}>
                {d.label}
              </option>
            ))}
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
            <span className="font-semibold text-slate-800">{data.clients.length}</span> cliente
            {data.clients.length !== 1 && 's'} · {data.label}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Estatus</th>
                  <th className="px-5 py-3 font-medium">Avance</th>
                  <th className="px-5 py-3 font-medium">Documentos faltantes</th>
                  <th className="px-5 py-3 font-medium">Última carga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.rfc}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {c.personType === 'moral' ? 'Moral' : 'Física'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={c.progress} className="w-16" />
                        <span className="text-xs text-slate-600">{c.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {c.pending.length === 0 ? (
                        <span className="text-emerald-600">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {c.pending.map((p) => (
                            <span
                              key={p}
                              className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(c.lastUploadAt)}</td>
                  </tr>
                ))}
                {data.clients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      Ningún cliente coincide con estos filtros.
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
