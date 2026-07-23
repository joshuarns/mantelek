import fs from 'node:fs'
import { Router } from 'express'
import archiver from 'archiver'
import { z } from 'zod'
import { pool, query } from '../db/pool.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { hashPassword } from '../lib/auth.js'
import { currentPeriod, periodFolder, periodLabel } from '../lib/period.js'
import { runOverdue, runReminders } from '../jobs/index.js'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireAdmin)

/** Nombre seguro para rutas de archivo: conserva acentos, cambia espacios por "_". */
function slugPath(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]+/g, '') // caracteres inválidos en rutas
    .trim()
    .replace(/\s+/g, '_')
}

// KPIs del dashboard (Módulo 7 y 8).
adminRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const { rows } = await query<{ status: string; count: string }>(
      `SELECT r.status, count(*)::text AS count
       FROM clients c
       LEFT JOIN monthly_records r ON r.client_id = c.id AND r.period = $1
       WHERE c.active
       GROUP BY r.status`,
      [currentPeriod()],
    )

    const stats = { total: 0, cumplido: 0, en_proceso: 0, vencido: 0, sin_actividad: 0 }
    for (const r of rows) {
      const n = Number(r.count)
      stats.total += n
      if (r.status && r.status in stats) {
        stats[r.status as keyof typeof stats] += n
      } else {
        stats.sin_actividad += n // clientes sin registro este periodo
      }
    }
    res.json(stats)
  }),
)

// Cartera de clientes con estatus del periodo actual.
adminRouter.get(
  '/clients',
  asyncHandler(async (req, res) => {
    const period =
      typeof req.query.period === 'string' ? req.query.period : currentPeriod()
    // ?inactivos=1 incluye también los clientes desactivados.
    const includeInactive = req.query.inactivos === '1'

    const { rows } = await query<{
      id: string
      name: string
      person_type: string
      rfc: string
      email: string | null
      admin_contact: string | null
      last_access_at: string | null
      last_upload_at: string | null
      active: boolean
      user_email: string | null
      status: string | null
      progress: number
      pending: number
    }>(
      `SELECT c.id, c.name, c.person_type, c.rfc, c.email, c.admin_contact,
              c.last_access_at, c.last_upload_at, c.active,
              (SELECT u.email FROM users u WHERE u.client_id = c.id ORDER BY u.created_at LIMIT 1) AS user_email,
              r.status,
              COALESCE(round(
                100.0 * count(*) FILTER (WHERE d.status = 'cargado' AND d.type <> 'otros')
                / NULLIF(count(*) FILTER (WHERE d.type <> 'otros'), 0)
              ), 0)::int AS progress,
              count(*) FILTER (WHERE d.status = 'pendiente' AND d.type <> 'otros')::int AS pending
       FROM clients c
       LEFT JOIN monthly_records r ON r.client_id = c.id AND r.period = $1
       LEFT JOIN documents d ON d.record_id = r.id
       WHERE ($2::boolean OR c.active)
       GROUP BY c.id, r.status
       ORDER BY c.active DESC, c.name`,
      [period, includeInactive],
    )

    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        personType: r.person_type,
        rfc: r.rfc,
        email: r.email,
        adminContact: r.admin_contact,
        active: r.active,
        userEmail: r.user_email,
        status: r.status ?? 'sin_actividad',
        progress: r.progress,
        pending: r.pending,
        lastAccessAt: r.last_access_at,
        lastUploadAt: r.last_upload_at,
      })),
    )
  }),
)

// ---------------------------------------------------------------------------
// Alta / edición de clientes (Módulo 1)
// ---------------------------------------------------------------------------

const clientSchema = z.object({
  name: z.string().min(2, 'La razón social es obligatoria'),
  personType: z.enum(['fisica', 'moral']),
  rfc: z.string().min(10, 'RFC inválido').max(13),
  taxRegime: z.string().optional(),
  taxAddress: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  adminContact: z.string().optional(),
  bank: z
    .object({
      bank: z.string().optional(),
      account: z.string().optional(),
      clabe: z.string().optional(),
    })
    .optional(),
})

const createSchema = clientSchema.extend({
  // Usuario de acceso al portal que se crea junto con el cliente.
  user: z.object({
    email: z.string().email('Correo de acceso inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    fullName: z.string().min(2, 'El nombre del usuario es obligatorio'),
  }),
})

// Crear cliente + su usuario de acceso.
adminRouter.post(
  '/clients',
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const d = parsed.data

    const db = await pool.connect()
    try {
      await db.query('BEGIN')

      const exists = await db.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [
        d.user.email,
      ])
      if (exists.rowCount) {
        await db.query('ROLLBACK')
        return res.status(409).json({
          error: 'El correo de acceso ya está en uso por otro usuario. Usa uno distinto.',
        })
      }

      const client = await db.query<{ id: string }>(
        `INSERT INTO clients
           (name, person_type, rfc, tax_regime, tax_address, phone, email, admin_contact,
            bank_name, bank_account, bank_clabe)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id`,
        [
          d.name, d.personType, d.rfc.toUpperCase(), d.taxRegime ?? null, d.taxAddress ?? null,
          d.phone ?? null, d.email || null, d.adminContact ?? null,
          d.bank?.bank ?? null, d.bank?.account ?? null, d.bank?.clabe ?? null,
        ],
      )

      await db.query(
        `INSERT INTO users (client_id, email, password_hash, full_name, role)
         VALUES ($1, lower($2), $3, $4, 'client')`,
        [client.rows[0].id, d.user.email, await hashPassword(d.user.password), d.user.fullName],
      )

      await db.query('COMMIT')
      res.status(201).json({ id: client.rows[0].id })
    } catch (err) {
      await db.query('ROLLBACK')
      throw err
    } finally {
      db.release()
    }
  }),
)

// Editar datos del cliente.
adminRouter.put(
  '/clients/:id',
  asyncHandler(async (req, res) => {
    const parsed = clientSchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const d = parsed.data

    const { rowCount } = await query(
      `UPDATE clients SET
         name          = COALESCE($2, name),
         person_type   = COALESCE($3, person_type),
         rfc           = COALESCE($4, rfc),
         tax_regime    = COALESCE($5, tax_regime),
         tax_address   = COALESCE($6, tax_address),
         phone         = COALESCE($7, phone),
         email         = COALESCE($8, email),
         admin_contact = COALESCE($9, admin_contact),
         bank_name     = COALESCE($10, bank_name),
         bank_account  = COALESCE($11, bank_account),
         bank_clabe    = COALESCE($12, bank_clabe)
       WHERE id = $1`,
      [
        req.params.id, d.name, d.personType, d.rfc?.toUpperCase(), d.taxRegime, d.taxAddress,
        d.phone, d.email || null, d.adminContact,
        d.bank?.bank, d.bank?.account, d.bank?.clabe,
      ],
    )
    if (!rowCount) return res.status(404).json({ error: 'Cliente no encontrado' })
    res.json({ ok: true })
  }),
)

// Activar / desactivar un cliente (deja de aparecer en la cartera y no puede entrar).
adminRouter.patch(
  '/clients/:id/active',
  asyncHandler(async (req, res) => {
    const active = z.object({ active: z.boolean() }).safeParse(req.body)
    if (!active.success) return res.status(400).json({ error: 'Valor inválido' })

    const { rowCount } = await query('UPDATE clients SET active = $2 WHERE id = $1', [
      req.params.id,
      active.data.active,
    ])
    if (!rowCount) return res.status(404).json({ error: 'Cliente no encontrado' })
    res.json({ ok: true })
  }),
)

// Cambiar la contraseña del usuario de acceso del cliente.
adminRouter.patch(
  '/clients/:id/password',
  asyncHandler(async (req, res) => {
    const parsed = z
      .object({ password: z.string().min(8, 'Mínimo 8 caracteres') })
      .safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { rowCount } = await query(
      `UPDATE users SET password_hash = $2 WHERE client_id = $1 AND role = 'client'`,
      [req.params.id, await hashPassword(parsed.data.password)],
    )
    if (!rowCount) return res.status(404).json({ error: 'Usuario del cliente no encontrado' })
    res.json({ ok: true })
  }),
)

// Eliminar definitivamente un cliente (expediente y archivos incluidos).
adminRouter.delete(
  '/clients/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query<{ file_path: string | null }>(
      `SELECT d.file_path
       FROM documents d
       JOIN monthly_records r ON r.id = d.record_id
       WHERE r.client_id = $1 AND d.file_path IS NOT NULL`,
      [req.params.id],
    )

    const { rowCount } = await query('DELETE FROM clients WHERE id = $1', [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'Cliente no encontrado' })

    // Los registros caen por ON DELETE CASCADE; los archivos hay que borrarlos aquí.
    for (const r of rows) {
      if (r.file_path && fs.existsSync(r.file_path)) fs.rmSync(r.file_path, { force: true })
    }
    res.json({ ok: true })
  }),
)

// ---------------------------------------------------------------------------
// Notificaciones (Módulo 5) — disparo manual y bitácora
// ---------------------------------------------------------------------------

// Envía los recordatorios de un día concreto sin esperar al cron.
// Útil para probar y para reenviar si un día falló.
adminRouter.post(
  '/notifications/run',
  asyncHandler(async (req, res) => {
    const parsed = z
      .object({
        day: z.union([z.literal(10), z.literal(15), z.literal(20)]),
        period: z.string().optional(),
      })
      .safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Indica day: 10, 15 o 20' })
    }
    const result = await runReminders(parsed.data.day, parsed.data.period)
    res.json(result)
  }),
)

// Marca como vencidos los expedientes incompletos del periodo.
adminRouter.post(
  '/notifications/overdue',
  asyncHandler(async (req, res) => {
    const period = typeof req.body?.period === 'string' ? req.body.period : undefined
    res.json(await runOverdue(period))
  }),
)

// Bitácora de todo lo enviado.
adminRouter.get(
  '/notifications',
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      `SELECT n.id, c.name AS client, n.period, n.kind, n.channel,
              n.recipient, n.status, n.error, n.sent_at
       FROM notifications n
       JOIN clients c ON c.id = n.client_id
       ORDER BY n.sent_at DESC
       LIMIT 100`,
    )
    res.json(rows)
  }),
)

// Descarga rápida en .zip para auditorías / SAT (Módulo 10).
adminRouter.get(
  '/download',
  asyncHandler(async (req, res) => {
    /** Lee un parámetro que puede venir repetido o separado por comas. */
    const list = (v: unknown): string[] | null => {
      const raw = Array.isArray(v) ? v.join(',') : typeof v === 'string' ? v : ''
      const items = raw.split(',').map((s) => s.trim()).filter(Boolean)
      return items.length ? items : null
    }

    // clientId (uno) y clientIds (varios) conviven: el segundo es el general.
    const clientIds = list(req.query.clientIds) ?? list(req.query.clientId)
    const period = typeof req.query.period === 'string' && req.query.period ? req.query.period : null
    const types = list(req.query.types) // filtro por tipo de documento

    const { rows } = await query<{
      client_name: string
      period: string
      file_path: string | null
      file_name: string | null
      label: string
    }>(
      `SELECT c.name AS client_name, r.period, d.file_path, d.file_name, d.label
       FROM documents d
       JOIN monthly_records r ON r.id = d.record_id
       JOIN clients c ON c.id = r.client_id
       WHERE d.status = 'cargado' AND d.file_path IS NOT NULL
         AND ($1::uuid[] IS NULL OR c.id = ANY($1))
         AND ($2::text IS NULL OR r.period = $2)
         AND ($3::text[] IS NULL OR d.type = ANY($3))
       ORDER BY c.name, r.period, d.type`,
      [clientIds, period, types],
    )

    const available = rows.filter((r) => r.file_path && fs.existsSync(r.file_path))
    if (available.length === 0) {
      return res.status(404).json({ error: 'No hay documentos que coincidan con el filtro' })
    }

    const zipName = `Mantelek_Documentos${period ? `_${periodFolder(period)}` : ''}.zip`
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`)

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.on('warning', (err) => console.warn('[zip]', err))
    archive.on('error', (err) => {
      throw err
    })
    archive.pipe(res)

    for (const doc of available) {
      const [year] = doc.period.split('-')
      const ext = doc.file_name?.match(/\.[a-z0-9]+$/i)?.[0] ?? '.pdf'
      const entry = `Mantelek_Documentos/${slugPath(doc.client_name)}/${year}/${periodFolder(doc.period)}/${slugPath(doc.label)}${ext}`
      archive.file(doc.file_path!, { name: entry })
    }

    // metadata útil para el área de contabilidad
    const clientNames = [...new Set(available.map((d) => d.client_name))]
    archive.append(
      `Paquete generado: ${new Date().toISOString()}\n` +
        `Clientes (${clientNames.length}): ${clientIds ? clientNames.join(', ') : 'Todos'}\n` +
        `Periodo: ${period ? periodLabel(period) : 'Todos'}\n` +
        `Tipos de documento: ${types ? types.join(', ') : 'Todos'}\n` +
        `Documentos: ${available.length}\n`,
      { name: 'Mantelek_Documentos/README.txt' },
    )

    await archive.finalize()
  }),
)
