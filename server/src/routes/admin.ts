import fs from 'node:fs'
import { Router } from 'express'
import archiver from 'archiver'
import { query } from '../db/pool.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { CURRENT_PERIOD, periodFolder, periodLabel } from '../lib/period.js'

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
       GROUP BY r.status`,
      [CURRENT_PERIOD],
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
    const period = typeof req.query.period === 'string' ? req.query.period : CURRENT_PERIOD

    const { rows } = await query<{
      id: string
      name: string
      person_type: string
      rfc: string
      email: string | null
      admin_contact: string | null
      last_access_at: string | null
      last_upload_at: string | null
      status: string | null
      progress: number
      pending: number
    }>(
      `SELECT c.id, c.name, c.person_type, c.rfc, c.email, c.admin_contact,
              c.last_access_at, c.last_upload_at,
              r.status,
              COALESCE(round(
                100.0 * count(*) FILTER (WHERE d.status = 'cargado' AND d.type <> 'otros')
                / NULLIF(count(*) FILTER (WHERE d.type <> 'otros'), 0)
              ), 0)::int AS progress,
              count(*) FILTER (WHERE d.status = 'pendiente' AND d.type <> 'otros')::int AS pending
       FROM clients c
       LEFT JOIN monthly_records r ON r.client_id = c.id AND r.period = $1
       LEFT JOIN documents d ON d.record_id = r.id
       GROUP BY c.id, r.status
       ORDER BY c.name`,
      [period],
    )

    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        personType: r.person_type,
        rfc: r.rfc,
        email: r.email,
        adminContact: r.admin_contact,
        status: r.status ?? 'sin_actividad',
        progress: r.progress,
        pending: r.pending,
        lastAccessAt: r.last_access_at,
        lastUploadAt: r.last_upload_at,
      })),
    )
  }),
)

// Descarga rápida en .zip para auditorías / SAT (Módulo 10).
adminRouter.get(
  '/download',
  asyncHandler(async (req, res) => {
    const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : undefined
    const period = typeof req.query.period === 'string' ? req.query.period : undefined

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
         AND ($1::uuid IS NULL OR c.id = $1)
         AND ($2::text IS NULL OR r.period = $2)
       ORDER BY c.name, r.period, d.type`,
      [clientId ?? null, period ?? null],
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
    archive.append(
      `Paquete generado: ${new Date().toISOString()}\n` +
        `Cliente: ${clientId ? available[0].client_name : 'Todos'}\n` +
        `Periodo: ${period ? periodLabel(period) : 'Todos'}\n` +
        `Documentos: ${available.length}\n`,
      { name: 'Mantelek_Documentos/README.txt' },
    )

    await archive.finalize()
  }),
)
