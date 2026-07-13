import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ProgressRing } from '../../components/ui/Progress'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { STATUS_LABEL, periodLabel } from '../../lib/format'
import type { HistoryItem, MeResponse } from '../../lib/apiTypes'

export function Dashboard() {
  const me = useFetch<MeResponse>('/me')
  const history = useFetch<HistoryItem[]>('/me/records')

  if (me.loading) return <Loading />
  if (me.error || !me.data)
    return <ErrorState message={me.error ?? 'No se pudo cargar'} onRetry={me.refetch} />

  const { currentRecord: record, deadlineDay, currentPeriod } = me.data
  const pending = record.documents.filter((d) => d.status === 'pendiente')
  const daysLeft = Math.max(0, deadlineDay - new Date().getDate())
  const otherMonths = (history.data ?? []).filter((r) => r.period !== currentPeriod).slice(0, 5)

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className="text-sm text-slate-500">Cumplimiento del mes</p>
        <h1 className="text-2xl font-bold text-slate-900">{record.label}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">
          <ProgressRing value={record.progress} label={STATUS_LABEL[record.status]} />
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-500">Fecha límite de cumplimiento</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">{deadlineDay}</p>
          <p className="text-sm text-slate-600">de {periodLabel(currentPeriod)}</p>
          {record.status === 'cumplido' ? (
            <p className="mt-2 text-sm font-semibold text-emerald-600">Completado</p>
          ) : (
            <p className="mt-2 text-sm font-semibold text-red-600">Faltan {daysLeft} días</p>
          )}
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-500">Estatus actual</p>
          <p
            className={`mt-1 text-xl font-bold ${
              record.status === 'cumplido' ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {STATUS_LABEL[record.status]}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {pending.length > 0
              ? 'Aún tienes documentos pendientes por cargar.'
              : 'Tu expediente del mes está completo.'}
          </p>
          {pending.length > 0 && (
            <Link
              to="/documentos"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Ir a cargar documentos
            </Link>
          )}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={20} />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Tienes {pending.length} documento{pending.length !== 1 && 's'} pendiente
                {pending.length !== 1 && 's'} por cargar.
              </p>
              <p className="text-sm text-amber-700">
                Recibirás recordatorios los 10, 15 y 20 de cada mes.
              </p>
            </div>
          </div>
          <Link to="/notificaciones" className="shrink-0 text-sm font-medium text-brand-600 hover:underline">
            Ver más
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Documentos pendientes</h2>
          <ul className="mt-3 space-y-2">
            {pending.map((d) => (
              <li key={d.type} className="flex items-center gap-2 text-sm text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                {d.label}
              </li>
            ))}
            {pending.length === 0 && (
              <li className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 size={16} /> ¡Todos los documentos cargados!
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Historial de cumplimientos</h2>
            <Link to="/historial" className="text-xs font-medium text-brand-600 hover:underline">
              Ver todo
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {otherMonths.map((r) => (
              <li key={r.period} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{r.label}</span>
                <StatusBadge status={r.status} dot />
              </li>
            ))}
            {otherMonths.length === 0 && (
              <li className="py-2 text-sm text-slate-400">Sin historial previo.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
