import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, MoreVertical, Search } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ProgressBar } from '../../components/ui/Progress'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { AdminClient, AdminStats, ComplianceStatus, PersonType } from '../../lib/apiTypes'

function pct(n: number, total: number): string {
  return total ? `${Math.round((n / total) * 100)}%` : '0%'
}

export function AdminDashboard() {
  const stats = useFetch<AdminStats>('/admin/stats')
  const clients = useFetch<AdminClient[]>('/admin/clients')

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ComplianceStatus | 'todos'>('todos')
  const [type, setType] = useState<PersonType | 'todos'>('todos')
  const [exportError, setExportError] = useState<string | null>(null)

  const rows = useMemo(() => {
    return (clients.data ?? []).filter((c) => {
      if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false
      if (status !== 'todos' && c.status !== status) return false
      if (type !== 'todos' && c.personType !== type) return false
      return true
    })
  }, [clients.data, query, status, type])

  if (stats.loading || clients.loading) return <Loading />
  if (stats.error || !stats.data)
    return <ErrorState message={stats.error ?? 'No se pudo cargar'} onRetry={stats.refetch} />

  const s = stats.data
  const kpis = [
    { label: 'Total Clientes', value: s.total },
    { label: 'Cumplidos', value: s.cumplido, hint: pct(s.cumplido, s.total), status: 'cumplido' as const },
    { label: 'En Proceso', value: s.en_proceso, hint: pct(s.en_proceso, s.total), status: 'en_proceso' as const },
    { label: 'Vencidos', value: s.vencido, hint: pct(s.vencido, s.total), status: 'vencido' as const },
    { label: 'Sin Actividad', value: s.sin_actividad, hint: pct(s.sin_actividad, s.total), status: 'sin_actividad' as const },
  ]

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard de Cumplimiento</h1>

      {exportError && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{exportError}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <h2 className="mr-auto font-semibold text-slate-900">Lista de Clientes</h2>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ComplianceStatus | 'todos')}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700"
          >
            <option value="todos">Estatus: Todos</option>
            <option value="cumplido">Cumplido</option>
            <option value="en_proceso">En proceso</option>
            <option value="vencido">Vencido</option>
            <option value="sin_actividad">Sin actividad</option>
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as PersonType | 'todos')}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700"
          >
            <option value="todos">Tipo: Todos</option>
            <option value="moral">Moral</option>
            <option value="fisica">Física</option>
          </select>
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-48 rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-sm"
            />
          </div>
          <button
            onClick={() =>
              api
                .download('/admin/download', 'Mantelek_Documentos.zip')
                .catch((err) =>
                  setExportError(err instanceof Error ? err.message : 'No se pudo exportar'),
                )
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Download size={15} /> Exportar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Estatus</th>
                <th className="px-4 py-3 font-medium">Avance</th>
                <th className="px-4 py-3 font-medium">Doc. Pendientes</th>
                <th className="px-4 py-3 font-medium">Última Actividad</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">
                    {c.personType === 'moral' ? 'Moral' : 'Física'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={c.progress} className="w-20" />
                      <span className="text-xs text-slate-600">{c.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{c.pending}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(c.lastUploadAt)}</td>
                  <td className="px-4 py-3">
                    <button className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    {(clients.data ?? []).length === 0 ? (
                      <>
                        Aún no hay clientes.{' '}
                        <Link to="/admin/clientes" className="font-medium text-brand-600 hover:underline">
                          Da de alta el primero
                        </Link>
                        .
                      </>
                    ) : (
                      'No hay clientes que coincidan con los filtros.'
                    )}
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
