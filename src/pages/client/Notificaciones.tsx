import { CheckCircle2 } from 'lucide-react'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import type { MeResponse } from '../../lib/apiTypes'

type Tone = 'info' | 'warning' | 'danger' | 'success'

const DAY_STYLE: Record<Tone, string> = {
  info: 'bg-brand-500 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-red-500 text-white',
  success: 'bg-emerald-500 text-white',
}
const BORDER: Record<Tone, string> = {
  info: 'border-l-brand-500',
  warning: 'border-l-amber-500',
  danger: 'border-l-red-500',
  success: 'border-l-emerald-500',
}

export function Notificaciones() {
  const { data, loading, error, refetch } = useFetch<MeResponse>('/me')

  if (loading) return <Loading />
  if (error || !data)
    return <ErrorState message={error ?? 'No se pudo cargar'} onRetry={refetch} />

  const record = data.currentRecord
  const pending = record.documents.filter((d) => d.status === 'pendiente' && d.type !== 'otros').length
  const complete = record.status === 'cumplido'

  // Recordatorios programados (Módulo 5). El envío automático por
  // correo/WhatsApp se implementará en el backend con un cron.
  const reminders: { day: number; tone: Tone; title: string; message: string }[] = [
    {
      day: 10,
      tone: 'info',
      title: 'Recordatorio día 10',
      message:
        'Estimado cliente, le recordamos que aún tiene documentos pendientes por cargar para completar su expediente del mes. Fecha límite: 20 de ' +
        record.label.split(' ')[0] + '.',
    },
    {
      day: 15,
      tone: 'warning',
      title: 'Recordatorio día 15',
      message:
        pending === 1
          ? 'Su expediente está casi completo. Solo falta un documento para finalizar el cumplimiento del mes.'
          : `Aún tiene ${pending} documentos pendientes por cargar. Evite retrasos en sus pagos completando su documentación.`,
    },
    {
      day: 20,
      tone: 'danger',
      title: 'Último día',
      message:
        'Hoy es el último día para cargar su documentación. Si no completa su expediente, su estatus cambiará a No Cumplido.',
    },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Alertas y Notificaciones</h1>
      <p className="mt-1 text-sm text-slate-500">
        Recibirás recordatorios automáticos por correo y WhatsApp mientras tengas documentos pendientes.
      </p>

      <div className="mt-5 space-y-3">
        {complete ? (
          <div className="flex items-start gap-4 rounded-xl border border-emerald-200 border-l-4 border-l-emerald-500 bg-emerald-50 p-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <CheckCircle2 size={26} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-emerald-800">
                ¡Gracias! Tu expediente del mes ha sido completado correctamente.
              </p>
              <p className="mt-0.5 text-sm text-emerald-700">
                Estatus actual: Cumplido al {record.progress}%
              </p>
            </div>
          </div>
        ) : (
          reminders.map((n) => (
            <div
              key={n.day}
              className={`flex items-start gap-4 rounded-xl border border-slate-200 border-l-4 bg-white p-4 ${BORDER[n.tone]}`}
            >
              <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl ${DAY_STYLE[n.tone]}`}>
                <span className="text-xl font-bold leading-none">{n.day}</span>
                <span className="text-[10px] uppercase tracking-wide">Día</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{n.title}</p>
                <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
