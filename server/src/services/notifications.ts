import { query } from '../db/pool.js'
import { config } from '../config.js'
import { sendEmail } from './mailer.js'
import { sendWhatsApp } from './whatsapp.js'
import { periodLabel, DEADLINE_DAY } from '../lib/period.js'

export type NotificationKind = 'dia_10' | 'dia_15' | 'dia_20' | 'completado'

interface Target {
  clientId: string
  name: string
  email: string | null
  phone: string | null
  period: string
  /** Etiquetas de los documentos obligatorios que faltan. */
  pending: string[]
}

/**
 * Construye el mensaje según cuántos documentos falten (Módulo 5).
 * El tono cambia si falta uno solo, si faltan varios, o si ya está completo.
 */
export function buildMessage(t: Target, kind: NotificationKind) {
  const mes = periodLabel(t.period)

  if (kind === 'completado') {
    return {
      subject: `Expediente de ${mes} completado`,
      text:
        'Gracias. Su expediente documental del mes ha sido completado correctamente. ' +
        'Su estatus actual es Cumplido.',
    }
  }

  const faltan = t.pending
  if (faltan.length === 1) {
    return {
      subject: `Solo falta un documento — ${mes}`,
      text:
        `Su expediente está casi completo. Solo falta cargar su ${faltan[0]} ` +
        `para finalizar el cumplimiento del mes.`,
    }
  }

  const urgencia =
    kind === 'dia_20'
      ? `Hoy es el último día para cargar su documentación. Si no completa su expediente, su estatus cambiará a No Cumplido.`
      : `Recuerde que la fecha límite es el día ${DEADLINE_DAY}.`

  return {
    subject: `Documentación pendiente — ${mes}`,
    text:
      `Estimado cliente, aún tiene documentación pendiente por cargar para completar ` +
      `su expediente del mes. ${urgencia}`,
  }
}

function renderHtml(t: Target, subject: string, text: string) {
  const lista = t.pending.length
    ? `<ul style="margin:16px 0;padding-left:20px;color:#334155">
         ${t.pending.map((d) => `<li style="margin:4px 0">${d}</li>`).join('')}
       </ul>`
    : ''

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px">
    <div style="font-size:20px;font-weight:700;color:#0f2947;margin-bottom:16px">Mantelek</div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px">
      <h1 style="margin:0 0 12px;font-size:17px;color:#0f172a">${subject}</h1>
      <p style="margin:0;color:#475569;line-height:1.55">${text}</p>
      ${lista ? `<p style="margin:16px 0 0;font-weight:600;color:#0f172a">Documentos pendientes:</p>${lista}` : ''}
      <a href="${config.portalUrl}"
         style="display:inline-block;margin-top:8px;background:#2563eb;color:#fff;text-decoration:none;
                padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px">
        Ir al portal
      </a>
    </div>
    <p style="color:#94a3b8;font-size:12px;margin-top:16px;text-align:center">
      Este es un recordatorio automático de Mantelek.
    </p>
  </div>`
}

/**
 * Envía un recordatorio y lo registra en la bitácora.
 * Es idempotente: la restricción UNIQUE(client_id, period, kind, channel)
 * impide que el mismo aviso se envíe dos veces.
 */
export async function notify(t: Target, kind: NotificationKind): Promise<boolean> {
  const { subject, text } = buildMessage(t, kind)

  // Reserva el envío primero. Si ya existía, no hacemos nada.
  const reserved = await query(
    `INSERT INTO notifications (client_id, period, kind, channel, recipient, subject, message, status)
     VALUES ($1, $2, $3, 'email', $4, $5, $6, 'enviado')
     ON CONFLICT (client_id, period, kind, channel) DO NOTHING
     RETURNING id`,
    [t.clientId, t.period, kind, t.email, subject, text],
  )
  if (reserved.rowCount === 0) return false // ya se había enviado

  if (!t.email) {
    await query(
      `UPDATE notifications SET status = 'error', error = 'El cliente no tiene correo'
       WHERE client_id = $1 AND period = $2 AND kind = $3 AND channel = 'email'`,
      [t.clientId, t.period, kind],
    )
    return false
  }

  const result = await sendEmail(t.email, subject, renderHtml(t, subject, text))

  await query(
    `UPDATE notifications SET status = $4, error = $5
     WHERE client_id = $1 AND period = $2 AND kind = $3 AND channel = 'email'`,
    [t.clientId, t.period, kind, result.status, result.error ?? null],
  )

  // WhatsApp (si algún día se activa) se registra en su propia fila.
  if (config.whatsappEnabled && t.phone) {
    const wa = await sendWhatsApp(t.phone, text)
    await query(
      `INSERT INTO notifications (client_id, period, kind, channel, recipient, subject, message, status, error)
       VALUES ($1, $2, $3, 'whatsapp', $4, $5, $6, $7, $8)
       ON CONFLICT (client_id, period, kind, channel) DO NOTHING`,
      [t.clientId, t.period, kind, t.phone, subject, text, wa.status, wa.error ?? null],
    )
  }

  return result.status === 'enviado' || result.status === 'simulado'
}

/**
 * Clientes activos con documentos obligatorios pendientes en un periodo.
 * Los que ya están al 100% quedan fuera: el sistema deja de molestarlos.
 */
export async function clientsWithPending(period: string): Promise<Target[]> {
  const { rows } = await query<{
    client_id: string
    name: string
    email: string | null
    phone: string | null
    pending: string[]
  }>(
    `SELECT c.id AS client_id, c.name, c.email, c.phone,
            array_agg(d.label ORDER BY d.label)
              FILTER (WHERE d.status = 'pendiente' AND d.type <> 'otros') AS pending
     FROM clients c
     JOIN monthly_records r ON r.client_id = c.id AND r.period = $1
     JOIN documents d ON d.record_id = r.id
     WHERE c.active
     GROUP BY c.id
     HAVING count(*) FILTER (WHERE d.status = 'pendiente' AND d.type <> 'otros') > 0`,
    [period],
  )

  return rows.map((r) => ({
    clientId: r.client_id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    period,
    pending: r.pending ?? [],
  }))
}

/** Aviso de "gracias, expediente completo" (se dispara al llegar al 100%). */
export async function notifyCompleted(clientId: string, period: string) {
  const { rows } = await query<{ name: string; email: string | null; phone: string | null }>(
    'SELECT name, email, phone FROM clients WHERE id = $1 AND active',
    [clientId],
  )
  if (!rows[0]) return
  await notify(
    { clientId, period, name: rows[0].name, email: rows[0].email, phone: rows[0].phone, pending: [] },
    'completado',
  )
}
