import fs from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import { query } from '../db/pool.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { upload, saveFile, removeFile } from '../lib/upload.js'
import { docDef } from '../lib/documents.js'
import { isValidPeriod } from '../lib/period.js'
import {
  ensureRecord,
  getDocuments,
  refreshRecordStatus,
  serializeRecord,
} from '../services/records.js'
import { getClient } from '../services/clients.js'

export const documentsRouter = Router()
documentsRouter.use(requireAuth)

interface DocLookup {
  id: string
  record_id: string
  client_id: string
  type: string
  file_path: string | null
  file_name: string | null
  mime_type: string | null
}

async function findDocById(id: string): Promise<DocLookup | undefined> {
  const { rows } = await query<DocLookup>(
    `SELECT d.id, d.record_id, r.client_id, d.type, d.file_path, d.file_name, d.mime_type
     FROM documents d
     JOIN monthly_records r ON r.id = d.record_id
     WHERE d.id = $1`,
    [id],
  )
  return rows[0]
}

// Cargar un documento del periodo actual (Módulo 3).
documentsRouter.post(
  '/:period/:type',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const clientId = req.auth?.clientId
    if (!clientId) return res.status(403).json({ error: 'Sin expediente de cliente' })

    const { period, type } = req.params
    if (!isValidPeriod(period)) return res.status(400).json({ error: 'Periodo inválido' })
    const def = docDef(type)
    if (!def) return res.status(400).json({ error: 'Tipo de documento desconocido' })
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido (campo "file")' })

    const client = await getClient(clientId)
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' })
    if (!def.appliesTo.includes(client.person_type)) {
      return res.status(400).json({ error: 'Este documento no aplica a tu tipo de persona' })
    }

    const record = await ensureRecord(clientId, period, client.person_type)

    const ext = path.extname(req.file.originalname) || '.pdf'
    const storedName = `${def.file}${ext}`
    const filePath = saveFile(clientId, period, storedName, req.file.buffer)

    await query(
      `UPDATE documents SET
         status = 'cargado', file_name = $3, file_path = $4,
         file_size = $5, mime_type = $6, uploaded_at = now(), uploaded_by = $7
       WHERE record_id = $1 AND type = $2`,
      [
        record.id,
        type,
        req.file.originalname,
        filePath,
        req.file.size,
        req.file.mimetype,
        req.auth?.role === 'admin' ? 'Administrador' : client.admin_contact ?? 'Cliente',
      ],
    )

    await query('UPDATE clients SET last_upload_at = now() WHERE id = $1', [clientId])
    await refreshRecordStatus(record.id)

    const docs = await getDocuments(record.id)
    const fresh = await ensureRecord(clientId, period, client.person_type)
    res.json(serializeRecord(fresh, docs))
  }),
)

// Eliminar un documento cargado.
documentsRouter.delete(
  '/:period/:type',
  asyncHandler(async (req, res) => {
    const clientId = req.auth?.clientId
    if (!clientId) return res.status(403).json({ error: 'Sin expediente de cliente' })

    const { period, type } = req.params
    const client = await getClient(clientId)
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' })

    const record = await ensureRecord(clientId, period, client.person_type)
    const { rows } = await query<{ file_path: string | null }>(
      'SELECT file_path FROM documents WHERE record_id = $1 AND type = $2',
      [record.id, type],
    )
    if (!rows[0]) return res.status(404).json({ error: 'Documento no encontrado' })

    removeFile(rows[0].file_path)
    await query(
      `UPDATE documents SET
         status = 'pendiente', file_name = NULL, file_path = NULL,
         file_size = NULL, mime_type = NULL, uploaded_at = NULL, uploaded_by = NULL
       WHERE record_id = $1 AND type = $2`,
      [record.id, type],
    )
    await refreshRecordStatus(record.id)

    const docs = await getDocuments(record.id)
    const fresh = await ensureRecord(clientId, period, client.person_type)
    res.json(serializeRecord(fresh, docs))
  }),
)

// Descargar/ver un documento por id (cliente dueño o administrador).
documentsRouter.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const doc = await findDocById(req.params.id)
    if (!doc || !doc.file_path) {
      return res.status(404).json({ error: 'Documento no disponible' })
    }
    const isOwner = req.auth?.clientId === doc.client_id
    if (!isOwner && req.auth?.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permiso sobre este documento' })
    }
    if (!fs.existsSync(doc.file_path)) {
      return res.status(410).json({ error: 'El archivo ya no existe en el servidor' })
    }
    res.setHeader('Content-Type', doc.mime_type ?? 'application/octet-stream')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${doc.file_name ?? 'documento'}"`,
    )
    fs.createReadStream(doc.file_path).pipe(res)
  }),
)
