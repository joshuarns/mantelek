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
