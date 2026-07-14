const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const DEADLINE_DAY = 20

/**
 * Periodo en curso ("YYYY-MM"). Se calcula del mes actual.
 * `CURRENT_PERIOD` permite fijarlo solo para pruebas.
 */
export function currentPeriod(): string {
  if (process.env.CURRENT_PERIOD) return process.env.CURRENT_PERIOD
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** Días restantes hasta la fecha límite del mes en curso (0 si ya pasó). */
export function daysUntilDeadline(): number {
  return Math.max(0, DEADLINE_DAY - new Date().getDate())
}

export function isValidPeriod(period: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(period)
}

/** "2026-07" -> "Julio 2026" */
export function periodLabel(period: string): string {
  const [year, month] = period.split('-')
  return `${MONTHS_ES[Number(month) - 1]} ${year}`
}

/** "2026-07" -> "07_Julio" (carpeta de descarga) */
export function periodFolder(period: string): string {
  const [, month] = period.split('-')
  return `${month}_${MONTHS_ES[Number(month) - 1]}`
}
