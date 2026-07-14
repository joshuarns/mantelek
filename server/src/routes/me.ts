import { Router } from 'express'
import { z } from 'zod'
import { query } from '../db/pool.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { getClient, serializeClient } from '../services/clients.js'
import {
  ensureRecord,
  getDocuments,
  serializeRecord,
} from '../services/records.js'
import { currentPeriod, DEADLINE_DAY, periodLabel } from '../lib/period.js'

export const meRouter = Router()
meRouter.use(requireAuth)

/** Solo clientes tienen expediente propio. */
function clientId(req: Parameters<typeof requireAuth>[0]): string | null {
  return req.auth?.clientId ?? null
}

// Información general del cliente + resumen del periodo actual.
meRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const id = clientId(req)
    if (!id) return res.status(403).json({ error: 'Sin expediente de cliente' })

    const client = await getClient(id)
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' })

    const period = currentPeriod()
    const record = await ensureRecord(id, period, client.person_type)
    const docs = await getDocuments(record.id)

    res.json({
      client: serializeClient(client),
      currentPeriod: period,
      deadlineDay: DEADLINE_DAY,
      currentRecord: serializeRecord(record, docs),
    })
  }),
)

const updateSchema = z.object({
  taxRegime: z.string().optional(),
  taxAddress: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  adminContact: z.string().optional(),
  bank: z
    .object({
      bank: z.string().optional(),
      account: z.string().optional(),
      clabe: z.string().optional(),
    })
    .optional(),
})

// Actualizar información general (Módulo 1).
meRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const id = clientId(req)
    if (!id) return res.status(403).json({ error: 'Sin expediente de cliente' })

    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', issues: parsed.error.issues })
    }
    const d = parsed.data

    await query(
      `UPDATE clients SET
         tax_regime    = COALESCE($2, tax_regime),
         tax_address   = COALESCE($3, tax_address),
         phone         = COALESCE($4, phone),
         email         = COALESCE($5, email),
         admin_contact = COALESCE($6, admin_contact),
         bank_name     = COALESCE($7, bank_name),
         bank_account  = COALESCE($8, bank_account),
         bank_clabe    = COALESCE($9, bank_clabe)
       WHERE id = $1`,
      [
        id,
        d.taxRegime,
        d.taxAddress,
        d.phone,
        d.email,
        d.adminContact,
        d.bank?.bank,
        d.bank?.account,
        d.bank?.clabe,
      ],
    )

    const client = await getClient(id)
    res.json({ client: client && serializeClient(client) })
  }),
)

// Historial de cumplimiento (Módulo 6).
meRouter.get(
  '/records',
  asyncHandler(async (req, res) => {
    const id = clientId(req)
    if (!id) return res.status(403).json({ error: 'Sin expediente de cliente' })

    const { rows } = await query<{
      period: string
      status: string
      completed_at: string | null
      progress: number
    }>(
      `SELECT r.period, r.status, r.completed_at,
              COALESCE(
                round(
                  100.0 * count(*) FILTER (WHERE d.status = 'cargado' AND d.type <> 'otros')
                  / NULLIF(count(*) FILTER (WHERE d.type <> 'otros'), 0)
                ), 0
              )::int AS progress
       FROM monthly_records r
       LEFT JOIN documents d ON d.record_id = r.id
       WHERE r.client_id = $1
       GROUP BY r.id
       ORDER BY r.period DESC`,
      [id],
    )

    res.json(
      rows.map((r) => ({
        period: r.period,
        label: periodLabel(r.period),
        status: r.status,
        progress: r.progress,
        completedAt: r.completed_at,
      })),
    )
  }),
)

// Detalle de un periodo específico.
meRouter.get(
  '/records/:period',
  asyncHandler(async (req, res) => {
    const id = clientId(req)
    if (!id) return res.status(403).json({ error: 'Sin expediente de cliente' })

    const client = await getClient(id)
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' })

    const record = await ensureRecord(id, req.params.period, client.person_type)
    const docs = await getDocuments(record.id)
    res.json(serializeRecord(record, docs))
  }),
)
