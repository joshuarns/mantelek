import { Eye } from 'lucide-react'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { formatDate } from '../../lib/format'
import type { HistoryItem } from '../../lib/apiTypes'

export function HistorialCumplimiento() {
  const { data, loading, error, refetch } = useFetch<HistoryItem[]>('/me/records')

  if (loading) return <Loading />
  if (error || !data)
    return <ErrorState message={error ?? 'No se pudo cargar'} onRetry={refetch} />

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900">Historial de Cumplimiento</h1>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Mes</th>
                <th className="px-5 py-3 font-medium">Estatus</th>
                <th className="px-5 py-3 font-medium">Porcentaje</th>
                <th className="px-5 py-3 font-medium">Fecha de Cumplimiento</th>
                <th className="px-5 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((r) => (
                <tr key={r.period} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{r.label}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">{r.progress}%</td>
                  <td className="px-5 py-3.5 text-slate-600">{formatDate(r.completedAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end">
                      <button
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                        title="Ver expediente"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Sin registros de cumplimiento aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
