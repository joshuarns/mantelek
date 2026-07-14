import { useState } from 'react'
import { AlertTriangle, Bell, CalendarDays, CheckCircle2, FileText, Plus, Trash2, UserCog } from 'lucide-react'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { AdminConfig, AdminUser } from '../../lib/apiTypes'

function Card({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Bell
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <Icon size={18} className="text-brand-600" /> {title}
      </h2>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

export function Configuracion() {
  const cfg = useFetch<AdminConfig>('/admin/config')
  const users = useFetch<AdminUser[]>('/admin/users')

  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      await api.post('/admin/users', form)
      setForm({ email: '', password: '', fullName: '' })
      setAdding(false)
      users.refetch()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'No se pudo crear')
    } finally {
      setBusy(false)
    }
  }

  async function removeAdmin(u: AdminUser) {
    if (!confirm(`¿Eliminar el acceso de ${u.email}?`)) return
    setErr(null)
    try {
      await api.del(`/admin/users/${u.id}`)
      users.refetch()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'No se pudo eliminar')
    }
  }

  if (cfg.loading) return <Loading />
  if (cfg.error || !cfg.data)
    return <ErrorState message={cfg.error ?? 'No se pudo cargar'} onRetry={cfg.refetch} />

  const c = cfg.data
  const n = c.notifications

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-500">
          Reglas del portal y usuarios administradores.
        </p>
      </div>

      {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          icon={CalendarDays}
          title="Fecha límite"
          hint="Día del mes en que vence la documentación."
        >
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900">{c.deadlineDay}</span>
            <span className="text-sm text-slate-500">de cada mes</span>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Los expedientes incompletos pasan a <strong>Vencido</strong> el día{' '}
            {c.deadlineDay + 1}.
          </p>
        </Card>

        <Card
          icon={Bell}
          title="Notificaciones"
          hint="Recordatorios automáticos por correo."
        >
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Recordatorios</dt>
              <dd className="font-medium text-slate-800">
                {n.remindersEnabled ? `Días ${n.reminderDays.join(', ')} a las 09:00` : 'Desactivados'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Zona horaria</dt>
              <dd className="text-slate-800">{n.timezone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Remitente</dt>
              <dd className="truncate text-slate-800">{n.mailFrom}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">WhatsApp</dt>
              <dd className="text-slate-800">{n.whatsappEnabled ? 'Activo' : 'No configurado'}</dd>
            </div>
          </dl>

          {n.emailConfigured ? (
            <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 size={15} /> El correo está configurado y los recordatorios se envían.
            </p>
          ) : (
            <p className="mt-4 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>
                Falta la API key del correo. Los recordatorios se registran como{' '}
                <strong>simulado</strong> y <strong>nadie los recibe</strong>. Configura{' '}
                <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> en el servidor.
              </span>
            </p>
          )}
        </Card>
      </div>

      <Card
        icon={FileText}
        title="Documentos requeridos"
        hint="Qué se le pide a cada tipo de persona cada mes."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Documento</th>
                <th className="pb-2 font-medium">Persona Física</th>
                <th className="pb-2 font-medium">Persona Moral</th>
                <th className="pb-2 font-medium">Cuenta para el avance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {c.documents.map((d) => (
                <tr key={d.type}>
                  <td className="py-2.5 font-medium text-slate-800">{d.label}</td>
                  <td className="py-2.5">
                    {d.appliesTo.includes('fisica') ? (
                      <CheckCircle2 size={15} className="text-emerald-500" />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    {d.appliesTo.includes('moral') ? (
                      <CheckCircle2 size={15} className="text-emerald-500" />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 text-slate-600">
                    {d.optional ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">Opcional</span>
                    ) : (
                      'Sí'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Este catálogo se define en el código del servidor. Para cambiarlo, edita{' '}
          <code className="rounded bg-slate-100 px-1">server/src/lib/documents.ts</code>.
        </p>
      </Card>

      <Card icon={UserCog} title="Administradores" hint="Quién puede entrar al panel de Mantelek.">
        <ul className="divide-y divide-slate-100">
          {(users.data ?? []).map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-800">{u.fullName}</p>
                <p className="text-xs text-slate-500">
                  {u.email} · desde {formatDate(u.createdAt)}
                </p>
              </div>
              <button
                onClick={() => removeAdmin(u)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Eliminar acceso"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>

        {adding ? (
          <form onSubmit={addAdmin} className="mt-4 grid gap-2 sm:grid-cols-3">
            <input
              required
              placeholder="Nombre completo"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              type="email"
              placeholder="Correo"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Contraseña (mín. 8)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2 sm:col-span-3">
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {busy ? 'Creando…' : 'Crear administrador'}
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus size={15} /> Agregar administrador
          </button>
        )}
      </Card>
    </div>
  )
}
