import { StatusBadge } from '../../components/ui/StatusBadge'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { formatDate } from '../../lib/format'
import type { AdminClient } from '../../lib/apiTypes'

export function Clientes() {
  const { data, loading, error, refetch } = useFetch<AdminClient[]>('/admin/clients')

  if (loading) return <Loading />
  if (error || !data)
    return <ErrorState message={error ?? 'No se pudo cargar'} onRetry={refetch} />

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">{c.name}</h2>
                <p className="text-xs text-slate-500">
                  {c.personType === 'moral' ? 'Persona Moral' : 'Persona Física'} · {c.rfc}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-400">Contacto</dt>
              <dd className="text-right text-slate-700">{c.adminContact ?? '—'}</dd>
              <dt className="text-slate-400">Correo</dt>
              <dd className="truncate text-right text-slate-700">{c.email ?? '—'}</dd>
              <dt className="text-slate-400">Avance del mes</dt>
              <dd className="text-right text-slate-700">{c.progress}%</dd>
              <dt className="text-slate-400">Último acceso</dt>
              <dd className="text-right text-slate-700">{formatDate(c.lastAccessAt)}</dd>
              <dt className="text-slate-400">Última carga</dt>
              <dd className="text-right text-slate-700">{formatDate(c.lastUploadAt)}</dd>
              <dt className="text-slate-400">Doc. pendientes</dt>
              <dd className="text-right text-slate-700">{c.pending}</dd>
            </dl>
          </div>
        ))}
      </div>
    </div>
  )
}
