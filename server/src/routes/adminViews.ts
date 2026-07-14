import { Router } from 'express'
import { z } from 'zod'
import { query } from '../db/pool.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { hashPassword } from '../lib/auth.js'
import { currentPeriod, periodLabel, DEADLINE_DAY } from '../lib/period.js'
import { DOC_CATALOG } from '../lib/documents.js'
import { config } from '../config.js'

/** Vistas del panel administrativo: cumplimiento, documentos, reportes y configuración. */
export const adminViewsRouter = Router()
adminViewsRouter.use(requireAuth, requireAdmin)

// ---------------------------------------------------------------------------
// Cumplimiento — vista consolidada con filtros (Módulo 7)
// ---------------------------------------------------------------------------
adminViewsRouter.get(
  '/compliance',
  asyncHandler(async (req, res) => {
    const period = (req.query.period as string) || currentPeriod()
    const personType = req.query.personType as string | undefined
    const status = req.query.status as string | undefined
    // Filtra clientes a los que les falta un documento concreto.
    const pendingType = req.query.pendingType as string | undefined

    const { rows } = await query<{
      id: string
      name: string
      person_type: string
      rfc: string
      status: string | null
      progress: number
      pending: string[] | null
      last_upload_at: string | null
    }>(
      `SELECT c.id, c.name, c.person_type, c.rfc, c.last_upload_at,
              r.status,
              COALESCE(round(
                100.0 * count(d.id) FILTER (WHERE d.status = 'cargado' AND d.type <> 'otros')
                / NULLIF(count(d.id) FILTER (WHERE d.type <> 'otros'), 0)
              ), 0)::int AS progress,
              array_agg(d.label ORDER BY d.label)
                FILTER (WHERE d.status = 'pendiente' AND d.type <> 'otros') AS pending
       FROM clients c
       LEFT JOIN monthly_records r ON r.client_id = c.id AND r.period = $1
       LEFT JOIN documents d ON d.record_id = r.id
       WHERE c.active
         AND ($2::text IS NULL OR c.person_type = $2)
         AND ($4::text IS NULL OR EXISTS (
               SELECT 1 FROM documents dd
               WHERE dd.record_id = r.id AND dd.type = $4 AND dd.status = 'pendiente'))
       GROUP BY c.id, r.status
       HAVING ($3::text IS NULL OR COALESCE(r.status, 'sin_actividad') = $3)
       ORDER BY c.name`,
      [period, personType ?? null, status ?? null, pendingType ?? null],
    )

    res.json({
      period,
      label: periodLabel(period),
      clients: rows.map((r) => ({
        id: r.id,
        name: r.name,
        personType: r.person_type,
        rfc: r.rfc,
        status: r.status ?? 'sin_actividad',
        progress: r.progress,
        pending: r.pending ?? [],
        lastUploadAt: r.last_upload_at,
      })),
    })
  }),
)

// Historial mensual de un cliente concreto (Módulo 7).
adminViewsRouter.get(
  '/clients/:id/records',
  asyncHandler(async (req, res) => {
    const { rows } = await query<{
      period: string
      status: string
      completed_at: string | null
      progress: number
    }>(
      `SELECT r.period, r.status, r.completed_at,
              COALESCE(round(
                100.0 * count(*) FILTER (WHERE d.status = 'cargado' AND d.type <> 'otros')
                / NULLIF(count(*) FILTER (WHERE d.type <> 'otros'), 0)
              ), 0)::int AS progress
       FROM monthly_records r
       LEFT JOIN documents d ON d.record_id = r.id
       WHERE r.client_id = $1
       GROUP BY r.id
       ORDER BY r.period DESC`,
      [req.params.id],
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

// Observaciones internas sobre el cliente (Módulo 7).
adminViewsRouter.patch(
  '/clients/:id/notes',
  asyncHandler(async (req, res) => {
    const parsed = z.object({ notes: z.string().max(5000) }).safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Texto inválido' })

    const { rowCount } = await query('UPDATE clients SET notes = $2 WHERE id = $1', [
      req.params.id,
      parsed.data.notes,
    ])
    if (!rowCount) return res.status(404).json({ error: 'Cliente no encontrado' })
    res.json({ ok: true })
  }),
)

adminViewsRouter.get(
  '/clients/:id/notes',
  asyncHandler(async (req, res) => {
    const { rows } = await query<{ notes: string | null }>(
      'SELECT notes FROM clients WHERE id = $1',
      [req.params.id],
    )
    if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' })
    res.json({ notes: rows[0].notes ?? '' })
  }),
)

// ---------------------------------------------------------------------------
// Documentos — explorador de todos los expedientes (Módulo 7 y 9)
// ---------------------------------------------------------------------------
adminViewsRouter.get(
  '/documents',
  asyncHandler(async (req, res) => {
    const clientId = (req.query.clientId as string) || null
    const period = (req.query.period as string) || null
    const type = (req.query.type as string) || null
    const status = (req.query.status as string) || null

    const { rows } = await query<{
      id: string
      client_id: string
      client_name: string
      period: string
      type: string
      label: string
      status: string
      file_name: string | null
      file_size: string | null
      uploaded_at: string | null
      uploaded_by: string | null
    }>(
      `SELECT d.id, c.id AS client_id, c.name AS client_name, r.period,
              d.type, d.label, d.status, d.file_name, d.file_size,
              d.uploaded_at, d.uploaded_by
       FROM documents d
       JOIN monthly_records r ON r.id = d.record_id
       JOIN clients c ON c.id = r.client_id
       WHERE c.active
         AND ($1::uuid IS NULL OR c.id = $1)
         AND ($2::text IS NULL OR r.period = $2)
         AND ($3::text IS NULL OR d.type = $3)
         AND ($4::text IS NULL OR d.status = $4)
       ORDER BY r.period DESC, c.name, d.label
       LIMIT 300`,
      [clientId, period, type, status],
    )

    res.json(
      rows.map((d) => ({
        id: d.id,
        clientId: d.client_id,
        clientName: d.client_name,
        period: d.period,
        periodLabel: periodLabel(d.period),
        type: d.type,
        label: d.label,
        status: d.status,
        fileName: d.file_name,
        fileSize: d.file_size ? `${(Number(d.file_size) / 1_048_576).toFixed(1)} MB` : null,
        uploadedAt: d.uploaded_at,
        uploadedBy: d.uploaded_by,
      })),
    )
  }),
)

// ---------------------------------------------------------------------------
// Reportes — indicadores de la cartera (Módulo 7)
// ---------------------------------------------------------------------------
adminViewsRouter.get(
  '/reports',
  asyncHandler(async (req, res) => {
    const period = (req.query.period as string) || currentPeriod()

    // Evolución del cumplimiento en los últimos 6 periodos.
    const trend = await query<{
      period: string
      cumplido: number
      total: number
      avg_progress: number
    }>(
      `SELECT r.period,
              count(*) FILTER (WHERE r.status = 'cumplido')::int AS cumplido,
              count(*)::int AS total,
              COALESCE(round(avg(p.progress)), 0)::int AS avg_progress
       FROM monthly_records r
       JOIN clients c ON c.id = r.client_id AND c.active
       JOIN LATERAL (
         SELECT COALESCE(round(
                  100.0 * count(*) FILTER (WHERE d.status = 'cargado' AND d.type <> 'otros')
                  / NULLIF(count(*) FILTER (WHERE d.type <> 'otros'), 0)
                ), 0)::int AS progress
         FROM documents d WHERE d.record_id = r.id
       ) p ON true
       GROUP BY r.period
       ORDER BY r.period DESC
       LIMIT 6`,
    )

    // Documentos que más se atoran en el periodo.
    const bottlenecks = await query<{ label: string; pendientes: number }>(
      `SELECT d.label, count(*)::int AS pendientes
       FROM documents d
       JOIN monthly_records r ON r.id = d.record_id AND r.period = $1
       JOIN clients c ON c.id = r.client_id AND c.active
       WHERE d.status = 'pendiente' AND d.type <> 'otros'
       GROUP BY d.label
       ORDER BY pendientes DESC`,
      [period],
    )

    // Desglose por tipo de persona.
    const byType = await query<{
      person_type: string
      total: number
      cumplido: number
      avg_progress: number
    }>(
      `SELECT c.person_type,
              count(*)::int AS total,
              count(*) FILTER (WHERE r.status = 'cumplido')::int AS cumplido,
              COALESCE(round(avg(p.progress)), 0)::int AS avg_progress
       FROM clients c
       LEFT JOIN monthly_records r ON r.client_id = c.id AND r.period = $1
       LEFT JOIN LATERAL (
         SELECT COALESCE(round(
                  100.0 * count(*) FILTER (WHERE d.status = 'cargado' AND d.type <> 'otros')
                  / NULLIF(count(*) FILTER (WHERE d.type <> 'otros'), 0)
                ), 0)::int AS progress
         FROM documents d WHERE d.record_id = r.id
       ) p ON true
       WHERE c.active
       GROUP BY c.person_type`,
      [period],
    )

    res.json({
      period,
      label: periodLabel(period),
      trend: trend.rows.reverse().map((t) => ({
        period: t.period,
        label: periodLabel(t.period),
        cumplido: t.cumplido,
        total: t.total,
        avgProgress: t.avg_progress,
      })),
      bottlenecks: bottlenecks.rows,
      byPersonType: byType.rows.map((b) => ({
        personType: b.person_type,
        total: b.total,
        cumplido: b.cumplido,
        avgProgress: b.avg_progress,
      })),
    })
  }),
)

// ---------------------------------------------------------------------------
// Configuración (Módulo 7)
// ---------------------------------------------------------------------------
adminViewsRouter.get(
  '/config',
  asyncHandler(async (_req, res) => {
    res.json({
      deadlineDay: DEADLINE_DAY,
      currentPeriod: currentPeriod(),
      documents: DOC_CATALOG.map((d) => ({
        type: d.type,
        label: d.label,
        appliesTo: d.appliesTo,
        optional: Boolean(d.optional),
      })),
      notifications: {
        remindersEnabled: config.remindersEnabled,
        reminderDays: [10, 15, 20],
        timezone: config.timezone,
        // Nunca exponemos la API key, solo si está configurada.
        emailConfigured: Boolean(config.resendApiKey),
        mailFrom: config.mailFrom,
        whatsappEnabled: config.whatsappEnabled,
      },
      portalUrl: config.portalUrl,
    })
  }),
)

// Administradores de Mantelek.
adminViewsRouter.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      `SELECT id, email, full_name AS "fullName", created_at AS "createdAt"
       FROM users WHERE role = 'admin' ORDER BY created_at`,
    )
    res.json(rows)
  }),
)

adminViewsRouter.post(
  '/users',
  asyncHandler(async (req, res) => {
    const parsed = z
      .object({
        email: z.string().email(),
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
        fullName: z.string().min(2),
      })
      .safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { email, password, fullName } = parsed.data

    const exists = await query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email])
    if (exists.rowCount) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo' })
    }

    const { rows } = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES (lower($1), $2, $3, 'admin') RETURNING id`,
      [email, await hashPassword(password), fullName],
    )
    res.status(201).json({ id: rows[0].id })
  }),
)

adminViewsRouter.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    // Nadie puede eliminarse a sí mismo (evita quedarse sin acceso).
    if (req.auth?.userId === req.params.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' })
    }
    const remaining = await query(`SELECT count(*)::int AS n FROM users WHERE role = 'admin'`)
    if ((remaining.rows[0] as { n: number }).n <= 1) {
      return res.status(400).json({ error: 'Debe quedar al menos un administrador' })
    }
    const { rowCount } = await query(`DELETE FROM users WHERE id = $1 AND role = 'admin'`, [
      req.params.id,
    ])
    if (!rowCount) return res.status(404).json({ error: 'Administrador no encontrado' })
    res.json({ ok: true })
  }),
)
