const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/**
 * Periodo "actual" del portal. Se fija para la demo de modo que coincida
 * con los datos sembrados (Julio 2026). En producción usar el mes en curso.
 */
export const CURRENT_PERIOD = process.env.CURRENT_PERIOD ?? '2026-07'
export const DEADLINE_DAY = 20

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
