import { pool, query } from '../db/pool.js'
import {
  computeProgress,
  requiredDocuments,
  type PersonType,
} from '../lib/documents.js'
import { periodLabel } from '../lib/period.js'
import { notifyCompleted } from './notifications.js'

export interface DocumentRow {
  id: string
  type: string
  label: string
  status: 'cargado' | 'pendiente'
  file_name: string | null
  file_path: string | null
  file_size: string | null
  mime_type: string | null
  uploaded_at: string | null
  uploaded_by: string | null
}

export interface RecordRow {
  id: string
  client_id: string
  period: string
  status: string
  completed_at: string | null
}

/**
 * Devuelve el registro mensual de un cliente para un periodo, creándolo
 * automáticamente con sus documentos obligatorios si aún no existe (Módulo 3).
 */
export async function ensureRecord(
  clientId: string,
  period: string,
  personType: PersonType,
): Promise<RecordRow> {
  const existing = await query<RecordRow>(
    'SELECT id, client_id, period, status, completed_at FROM monthly_records WHERE client_id = $1 AND period = $2',
    [clientId, period],
  )
  if (existing.rows[0]) return existing.rows[0]

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const rec = await client.query<RecordRow>(
      `INSERT INTO monthly_records (client_id, period, status)
       VALUES ($1, $2, 'en_proceso')
       ON CONFLICT (client_id, period) DO UPDATE SET period = EXCLUDED.period
       RETURNING id, client_id, period, status, completed_at`,
      [clientId, period],
    )
    const recordId = rec.rows[0].id
    for (const def of requiredDocuments(personType)) {
      await client.query(
        `INSERT INTO documents (record_id, type, label)
         VALUES ($1, $2, $3)
         ON CONFLICT (record_id, type) DO NOTHING`,
        [recordId, def.type, def.label],
      )
    }
    await client.query('COMMIT')
    return rec.rows[0]
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function getDocuments(recordId: string): Promise<DocumentRow[]> {
  const { rows } = await query<DocumentRow>(
    `SELECT id, type, label, status, file_name, file_path, file_size, mime_type, uploaded_at, uploaded_by
     FROM documents WHERE record_id = $1
     ORDER BY id`,
    [recordId],
  )
  return rows
}

/**
 * Recalcula el estatus del registro a partir de sus documentos y lo persiste.
 * (El vencimiento por fecha lo maneja un proceso aparte; aquí solo cumplido/en proceso.)
 */
export async function refreshRecordStatus(recordId: string): Promise<void> {
  const docs = await getDocuments(recordId)
  const progress = computeProgress(docs)
  if (progress >= 100) {
    const { rows } = await query<{ client_id: string; period: string }>(
      `UPDATE monthly_records
       SET status = 'cumplido', completed_at = COALESCE(completed_at, now())
       WHERE id = $1
       RETURNING client_id, period`,
      [recordId],
    )
    // Aviso de expediente completo (Módulo 5). Es idempotente: si ya se envió
    // este periodo, no se repite. No debe romper la carga si el correo falla.
    if (rows[0]) {
      notifyCompleted(rows[0].client_id, rows[0].period).catch((err) =>
        console.error('[notificaciones] aviso de completado:', err),
      )
    }
  } else {
    await query(
      `UPDATE monthly_records
       SET status = CASE WHEN status = 'vencido' THEN 'vencido' ELSE 'en_proceso' END,
           completed_at = NULL
       WHERE id = $1`,
      [recordId],
    )
  }
}

/** Serializa un registro + documentos al formato que consume el frontend. */
export function serializeRecord(record: RecordRow, documents: DocumentRow[]) {
  return {
    period: record.period,
    label: periodLabel(record.period),
    status: record.status,
    progress: computeProgress(documents),
    completedAt: record.completed_at,
    documents: documents.map((d) => ({
      id: d.id,
      type: d.type,
      label: d.label,
      status: d.status,
      fileName: d.file_name,
      fileSize: d.file_size ? `${(Number(d.file_size) / 1_048_576).toFixed(1)} MB` : null,
      uploadedAt: d.uploaded_at,
      uploadedBy: d.uploaded_by,
    })),
  }
}
