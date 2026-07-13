import type { ComplianceStatus } from '../../lib/types'
import { STATUS_LABEL } from '../../lib/format'

const STYLES: Record<ComplianceStatus, string> = {
  cumplido: 'bg-emerald-100 text-emerald-700',
  en_proceso: 'bg-amber-100 text-amber-700',
  vencido: 'bg-red-100 text-red-700',
  sin_actividad: 'bg-slate-200 text-slate-600',
}

const DOT: Record<ComplianceStatus, string> = {
  cumplido: 'bg-emerald-500',
  en_proceso: 'bg-amber-500',
  vencido: 'bg-red-500',
  sin_actividad: 'bg-slate-400',
}

export function StatusBadge({
  status,
  dot = false,
}: {
  status: ComplianceStatus
  dot?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />}
      {STATUS_LABEL[status]}
    </span>
  )
}

/** Semáforo circular del Módulo 8. */
export function StatusLight({ status }: { status: ComplianceStatus }) {
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${DOT[status]}`}
      title={STATUS_LABEL[status]}
    />
  )
}
