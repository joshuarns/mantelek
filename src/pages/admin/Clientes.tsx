import { useState } from 'react'
import { FileSearch, KeyRound, Pencil, Plus, Power, Trash2, UserPlus, Users } from 'lucide-react'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Loading, ErrorState } from '../../components/ui/States'
import { ClientForm } from '../../components/admin/ClientForm'
import { ClientDetail } from '../../components/admin/ClientDetail'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { AdminClient } from '../../lib/apiTypes'

export function Clientes() {
  const [showInactive, setShowInactive] = useState(false)
  const { data, loading, error, refetch } = useFetch<AdminClient[]>(
    `/admin/clients${showInactive ? '?inactivos=1' : ''}`,
  )
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AdminClient | null>(null)
  const [detail, setDetail] = useState<AdminClient | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function run(id: string, fn: () => Promise<unknown>) {
    setBusy(id)
    setActionError(null)
    try {
      await fn()
      refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'La acción falló')
    } finally {
      setBusy(null)
    }
  }

  function toggleActive(c: AdminClient) {
    return run(c.id, () => api.patch(`/admin/clients/${c.id}/active`, { active: !c.active }))
  }

  function changePassword(c: AdminClient) {
    const password = prompt(`Nueva contraseña para ${c.userEmail ?? c.name} (mín. 8 caracteres):`)
    if (!password) return
    return run(c.id, () => api.patch(`/admin/clients/${c.id}/password`, { password }))
  }

  function remove(c: AdminClient) {
    if (
      !confirm(
        `¿Eliminar definitivamente a "${c.name}"?\n\nSe borrarán su expediente y todos sus documentos. Esta acción no se puede deshacer.`,
      )
    )
      return
    return run(c.id, () => api.del(`/admin/clients/${c.id}`))
  }

  if (loading) return <Loading />
  if (error || !data)
    return <ErrorState message={error ?? 'No se pudo cargar'} onRetry={refetch} />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-slate-300"
            />
            Mostrar desactivados
          </label>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus size={16} /> Nuevo cliente
          </button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</div>
      )}

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Users size={24} />
          </div>
          <p className="mt-3 font-medium text-slate-700">Aún no hay clientes</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Da de alta a tu primer cliente o proveedor. Se le creará un usuario de acceso al
            portal y su expediente del mes en curso.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <UserPlus size={16} /> Dar de alta un cliente
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((c) => (
            <div
              key={c.id}
              className={`rounded-2xl border bg-white p-5 ${
                c.active ? 'border-slate-200' : 'border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-slate-900">{c.name}</h2>
                  <p className="text-xs text-slate-500">
                    {c.personType === 'moral' ? 'Persona Moral' : 'Persona Física'} · {c.rfc}
                  </p>
                </div>
                {c.active ? (
                  <StatusBadge status={c.status} />
                ) : (
                  <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                    Desactivado
                  </span>
                )}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-slate-400">Acceso al portal</dt>
                <dd className="truncate text-right text-slate-700">{c.userEmail ?? '—'}</dd>
                <dt className="text-slate-400">Contacto</dt>
                <dd className="truncate text-right text-slate-700">{c.adminContact ?? '—'}</dd>
                <dt className="text-slate-400">Avance del mes</dt>
                <dd className="text-right text-slate-700">{c.progress}%</dd>
                <dt className="text-slate-400">Doc. pendientes</dt>
                <dd className="text-right text-slate-700">{c.pending}</dd>
                <dt className="text-slate-400">Último acceso</dt>
                <dd className="text-right text-slate-700">{formatDate(c.lastAccessAt)}</dd>
                <dt className="text-slate-400">Última carga</dt>
                <dd className="text-right text-slate-700">{formatDate(c.lastUploadAt)}</dd>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => setDetail(c)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <FileSearch size={14} /> Ficha
                </button>
                <button
                  onClick={() => setEditing(c)}
                  disabled={busy === c.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Pencil size={14} /> Editar
                </button>
                <button
                  onClick={() => changePassword(c)}
                  disabled={busy === c.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <KeyRound size={14} /> Contraseña
                </button>
                <button
                  onClick={() => toggleActive(c)}
                  disabled={busy === c.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Power size={14} /> {c.active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => remove(c)}
                  disabled={busy === c.id}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <ClientForm onClose={() => setCreating(false)} onSaved={refetch} />}
      {editing && (
        <ClientForm client={editing} onClose={() => setEditing(null)} onSaved={refetch} />
      )}
      {detail && <ClientDetail client={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
