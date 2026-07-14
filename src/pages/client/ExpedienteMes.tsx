import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Download } from 'lucide-react'
import { ProgressBar } from '../../components/ui/Progress'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import type { RecordDTO } from '../../lib/apiTypes'

/** Expediente de un periodo concreto, incluidos meses pasados (Módulo 9). */
export function ExpedienteMes() {
  const { period } = useParams()
  const { data, loading, error, refetch } = useFetch<RecordDTO>(
    period ? `/me/records/${period}` : null,
  )

  if (loading) return <Loading />
  if (error || !data)
    return <ErrorState message={error ?? 'No se pudo cargar el expediente'} onRetry={refetch} />

  const cargados = data.documents.filter((d) => d.status === 'cargado')

  return (
    <div className="mx-auto max-w-4xl">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link to="/historial" className="hover:text-brand-600">
          Historial de Cumplimiento
        </Link>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">{data.label}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Expediente de {data.label}</h1>
        <StatusBadge status={data.status} />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Cumplimiento del mes</span>
            <span className="font-semibold text-slate-900">{data.progress}%</span>
          </div>
          <ProgressBar value={data.progress} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Documento</th>
                <th className="pb-2 font-medium">Estatus</th>
                <th className="pb-2 font-medium">Cargado por</th>
                <th className="pb-2 text-right font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.documents.map((d) => (
                <tr key={d.type}>
                  <td className="py-3 font-medium text-slate-800">{d.label}</td>
                  <td className="py-3">
                    {d.status === 'cargado' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 size={15} />
                        {formatDateTime(d.uploadedAt)}
                      </span>
                    ) : (
                      <span className="font-medium text-slate-400">No se cargó</span>
                    )}
                  </td>
                  <td className="py-3 text-slate-600">{d.uploadedBy ?? '—'}</td>
                  <td className="py-3 text-right">
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
            </tbody>
          </table>
        </div>

        {cargados.length === 0 && (
          <p className="mt-4 text-center text-sm text-slate-400">
            No se cargó ningún documento en este periodo.
          </p>
        )}
      </div>
    </div>
  )
}
