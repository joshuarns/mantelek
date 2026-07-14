import cron from 'node-cron'
import { query } from '../db/pool.js'
import { config } from '../config.js'
import { currentPeriod, DEADLINE_DAY } from '../lib/period.js'
import { clientsWithPending, notify, type NotificationKind } from '../services/notifications.js'

const DAY_TO_KIND: Record<number, NotificationKind> = {
  10: 'dia_10',
  15: 'dia_15',
  20: 'dia_20',
}

/**
 * Envía los recordatorios del día indicado a los clientes con documentos
 * pendientes. Los que ya cumplieron al 100% no reciben nada (Módulo 5).
 */
export async function runReminders(day: number, period = currentPeriod()) {
  const kind = DAY_TO_KIND[day]
  if (!kind) throw new Error(`No hay recordatorio definido para el día ${day}`)

  const targets = await clientsWithPending(period)
  let sent = 0
  for (const t of targets) {
    if (await notify(t, kind)) sent++
  }
  console.log(
    `[recordatorios] ${kind} · ${period}: ${sent} enviados de ${targets.length} pendientes`,
  )
  return { kind, period, candidates: targets.length, sent }
}

/**
 * Marca como "vencido" los expedientes incompletos una vez pasada la fecha
 * límite. Los que están al 100% ya quedaron en "cumplido".
 */
export async function runOverdue(period = currentPeriod()) {
  const { rowCount } = await query(
    `UPDATE monthly_records r
     SET status = 'vencido'
     FROM clients c
     WHERE c.id = r.client_id
       AND c.active
       AND r.period = $1
       AND r.status <> 'cumplido'
       AND EXISTS (
         SELECT 1 FROM documents d
         WHERE d.record_id = r.id AND d.status = 'pendiente' AND d.type <> 'otros'
       )`,
    [period],
  )
  console.log(`[vencimiento] ${period}: ${rowCount} expedientes marcados como vencidos`)
  return { period, marked: rowCount ?? 0 }
}

/** Programa los cron jobs. Se llama al arrancar el servidor. */
export function startScheduler() {
  if (!config.remindersEnabled) {
    console.log('[cron] recordatorios desactivados (REMINDERS_ENABLED=false)')
    return
  }

  const opts = { timezone: config.timezone }

  // Recordatorios los días 10, 15 y 20 a las 09:00.
  cron.schedule(
    '0 9 10,15,20 * *',
    () => {
      const day = new Date().getDate()
      runReminders(day).catch((err) => console.error('[cron] recordatorios:', err))
    },
    opts,
  )

  // Al día siguiente de la fecha límite, marcar los incompletos como vencidos.
  cron.schedule(
    `0 1 ${DEADLINE_DAY + 1} * *`,
    () => {
      runOverdue().catch((err) => console.error('[cron] vencimiento:', err))
    },
    opts,
  )

  console.log(
    `[cron] recordatorios los días 10, 15 y 20 a las 09:00 · vencimiento el día ${DEADLINE_DAY + 1} (${config.timezone})`,
  )
}
