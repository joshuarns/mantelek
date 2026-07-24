import type { ComplianceStatus, DocumentType } from './types'

export const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

/** "2026-07" -> "Julio 2026" */
export function periodLabel(period: string): string {
  const [year, month] = period.split('-')
  return `${MONTHS_ES[Number(month) - 1]} ${year}`
}

/** "2026-07" -> "07_Julio" (para rutas de descarga) */
export function periodFolder(period: string): string {
  const [, month] = period.split('-')
  return `${month}_${MONTHS_ES[Number(month) - 1]}`
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Tiempo relativo en español: "hace 5 min", "hace 3 días", "ahora mismo". */
export function timeAgo(iso?: string | null): string {
  if (!iso) return 'Nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora mismo'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `hace ${d} día${d !== 1 ? 's' : ''}`
  const meses = Math.floor(d / 30)
  if (meses < 12) return `hace ${meses} mes${meses !== 1 ? 'es' : ''}`
  return `hace ${Math.floor(meses / 12)} año${Math.floor(meses / 12) !== 1 ? 's' : ''}`
}

export const STATUS_LABEL: Record<ComplianceStatus, string> = {
  cumplido: 'Cumplido',
  en_proceso: 'En proceso',
  vencido: 'Vencido',
  sin_actividad: 'Sin actividad',
}

export const DOCUMENT_FILE: Record<DocumentType, string> = {
  opinion_cumplimiento: 'Opinion_de_Cumplimiento_del_SAT.pdf',
  constancia_situacion_fiscal: 'Constancia_de_Situacion_Fiscal.pdf',
  estado_cuenta: 'Estado_de_Cuenta_Bancario.pdf',
  comprobante_domicilio: 'Comprobante_de_Domicilio.pdf',
  caratula_bancaria: 'Caratula_Bancaria.pdf',
  otros: 'Otros_Documentos.pdf',
}
