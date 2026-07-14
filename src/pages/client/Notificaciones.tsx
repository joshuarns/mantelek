import { BellOff, CheckCircle2, Mail } from 'lucide-react'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { formatDateTime, periodLabel } from '../../lib/format'
import type { NotificationDTO, NotificationKind } from '../../lib/apiTypes'

const STYLE: Record<NotificationKind, { badge: string; border: string; label: string }> = {
  dia_10: { badge: 'bg-brand-500 text-white', border: 'border-l-brand-500', label: '10' },
  dia_15: { badge: 'bg-amber-500 text-white', border: 'border-l-amber-500', label: '15' },
  dia_20: { badge: 'bg-red-500 text-white', border: 'border-l-red-500', label: '20' },
  completado: { badge: 'bg-emerald-500 text-white', border: 'border-l-emerald-500', label: '' },
}

export function Notificaciones() {
  const { data, loading, error, refetch } = useFetch<NotificationDTO[]>('/me/notifications')

  if (loading) return <Loading />
  if (error || !data)
    return <ErrorState message={error ?? 'No se pudo cargar'} onRetry={refetch} />

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Alertas y Notificaciones</h1>
      <p className="mt-1 text-sm text-slate-500">
        Recibirás recordatorios automáticos por correo los días 10, 15 y 20 mientras tengas
        documentos pendientes. Al completar tu expediente dejan de enviarse.
      </p>

      {data.length === 0 ? (
        <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <BellOff size={24} />
          </div>
          <p className="mt-3 font-medium text-slate-700">Sin notificaciones todavía</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Aquí aparecerán los recordatorios que te enviemos. Si mantienes tu expediente al
            día, no recibirás ninguno.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {data.map((n) => {
            const s = STYLE[n.kind]
            const done = n.kind === 'completado'
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 rounded-xl border border-l-4 p-4 ${s.border} ${
                  done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div
                  className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl ${s.badge}`}
                >
                  {done ? (
                    <CheckCircle2 size={26} />
                  ) : (
                    <>
                      <span className="text-xl font-bold leading-none">{s.label}</span>
                      <span className="text-[10px] uppercase tracking-wide">Día</span>
                    </>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${done ? 'text-emerald-800' : 'text-slate-900'}`}>
                    {n.subject ?? periodLabel(n.period)}
                  </p>
                  <p className={`mt-0.5 text-sm ${done ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {n.message}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <Mail size={12} /> {periodLabel(n.period)}
                    {n.status === 'simulado' && (
                      <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        simulado
                      </span>
                    )}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-slate-400">
                  {formatDateTime(n.sentAt)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
