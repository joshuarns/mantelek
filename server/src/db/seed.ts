import fs from 'node:fs'
import path from 'node:path'
import { pool } from './pool.js'
import { config } from '../config.js'
import { hashPassword } from '../lib/auth.js'
import {
  requiredDocuments,
  computeProgress,
  type PersonType,
  type DocumentType,
} from '../lib/documents.js'

/** Genera un PDF placeholder en disco y devuelve {path, size}. */
function writePlaceholderPdf(
  clientId: string,
  period: string,
  fileBase: string,
  title: string,
): { path: string; size: number } {
  const dir = path.join(config.uploadDir, clientId, period)
  fs.mkdirSync(dir, { recursive: true })
  const body = `BT /F1 18 Tf 72 720 Td (${title}) Tj ET`
  const pdf =
    `%PDF-1.4\n` +
    `1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n` +
    `2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n` +
    `3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n` +
    `4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n` +
    `5 0 obj<</Length ${body.length}>>stream\n${body}\nendstream endobj\n` +
    `trailer<</Root 1 0 R>>\n%%EOF`
  const fullPath = path.join(dir, `${fileBase}.pdf`)
  fs.writeFileSync(fullPath, pdf)
  return { path: fullPath, size: Buffer.byteLength(pdf) }
}

interface SeedRecord {
  period: string
  status: 'cumplido' | 'en_proceso' | 'vencido' | 'sin_actividad'
  loaded: DocumentType[] // documentos cargados en ese periodo
  completedAt?: string
  uploadDate: string // fecha usada para uploaded_at
}

interface SeedClient {
  name: string
  personType: PersonType
  rfc: string
  taxRegime: string
  taxAddress: string
  phone: string
  email: string
  adminContact: string
  bank: { name: string; account: string; clabe: string }
  constanciaUpdatedAt?: string
  lastAccessAt: string
  lastUploadAt: string
  user: { email: string; password: string; fullName: string }
  records: SeedRecord[]
}

const ALL_MORAL = requiredDocuments('moral').map((d) => d.type)

const SEED: SeedClient[] = [
  {
    name: 'Soluciones Integrales SA de CV',
    personType: 'moral',
    rfc: 'SIN120345678',
    taxRegime: '601 - General de Ley Personas Morales',
    taxAddress: 'Av. Siempre Viva 123, Col. Centro, 06000, Ciudad de México',
    phone: '55 1234 5678',
    email: 'contacto@soluciones.com',
    adminContact: 'Juan Pérez',
    bank: { name: 'Banorte', account: '1234 5678 9012', clabe: '072 180 012345678901' },
    constanciaUpdatedAt: '2026-01-15',
    lastAccessAt: '2026-07-09T10:12:00',
    lastUploadAt: '2026-07-05T10:30:00',
    user: { email: 'juan@soluciones.com', password: 'demo1234', fullName: 'Juan Pérez' },
    records: [
      {
        period: '2026-07',
        status: 'en_proceso',
        loaded: ['opinion_cumplimiento', 'constancia_situacion_fiscal', 'comprobante_domicilio', 'caratula_bancaria'],
        uploadDate: '2026-07-05',
      },
      { period: '2026-06', status: 'cumplido', loaded: ALL_MORAL, completedAt: '2026-06-18', uploadDate: '2026-06-18' },
      { period: '2026-05', status: 'cumplido', loaded: ALL_MORAL, completedAt: '2026-05-17', uploadDate: '2026-05-17' },
      { period: '2026-04', status: 'cumplido', loaded: ALL_MORAL, completedAt: '2026-04-19', uploadDate: '2026-04-19' },
      { period: '2026-03', status: 'en_proceso', loaded: ['opinion_cumplimiento', 'constancia_situacion_fiscal', 'comprobante_domicilio'], uploadDate: '2026-03-10' },
      { period: '2026-02', status: 'vencido', loaded: ['opinion_cumplimiento', 'constancia_situacion_fiscal'], uploadDate: '2026-02-08' },
      { period: '2026-01', status: 'cumplido', loaded: ALL_MORAL, completedAt: '2026-01-18', uploadDate: '2026-01-18' },
    ],
  },
  {
    name: 'Constructora del Norte SA de CV',
    personType: 'moral',
    rfc: 'CNO150620AB1',
    taxRegime: '601 - General de Ley Personas Morales',
    taxAddress: 'Blvd. Norte 900, Monterrey, N.L.',
    phone: '81 2345 6789',
    email: 'admin@construnorte.com',
    adminContact: 'Roberto Sáenz',
    bank: { name: 'BBVA', account: '9876 5432 1098', clabe: '012 580 098765432109' },
    lastAccessAt: '2026-07-08T16:40:00',
    lastUploadAt: '2026-07-06T11:00:00',
    user: { email: 'roberto@construnorte.com', password: 'demo1234', fullName: 'Roberto Sáenz' },
    records: [{ period: '2026-07', status: 'cumplido', loaded: ALL_MORAL, completedAt: '2026-07-06', uploadDate: '2026-07-06' }],
  },
  {
    name: 'María González Pérez',
    personType: 'fisica',
    rfc: 'GOPM900101HG2',
    taxRegime: '612 - Personas Físicas con Actividades Empresariales',
    taxAddress: 'Calle Roble 45, Guadalajara, Jal.',
    phone: '33 3456 7890',
    email: 'maria.gonzalez@correo.com',
    adminContact: 'María González',
    bank: { name: 'Santander', account: '4567 8901 2345', clabe: '014 320 045678901234' },
    lastAccessAt: '2026-07-07T09:15:00',
    lastUploadAt: '2026-07-02T14:20:00',
    user: { email: 'maria@correo.com', password: 'demo1234', fullName: 'María González' },
    records: [{ period: '2026-07', status: 'en_proceso', loaded: ['opinion_cumplimiento', 'constancia_situacion_fiscal', 'comprobante_domicilio'], uploadDate: '2026-07-02' }],
  },
  {
    name: 'Distribuidora ABC SA de CV',
    personType: 'moral',
    rfc: 'DAB180512CD3',
    taxRegime: '601 - General de Ley Personas Morales',
    taxAddress: 'Av. Reforma 200, Ciudad de México',
    phone: '55 9876 5432',
    email: 'compras@distribuidoraabc.com',
    adminContact: 'Laura Méndez',
    bank: { name: 'HSBC', account: '3210 9876 5432', clabe: '021 180 032109876543' },
    lastAccessAt: '2026-07-02T10:00:00',
    lastUploadAt: '2026-06-30T18:00:00',
    user: { email: 'laura@distribuidoraabc.com', password: 'demo1234', fullName: 'Laura Méndez' },
    records: [{ period: '2026-07', status: 'vencido', loaded: ['opinion_cumplimiento'], uploadDate: '2026-06-30' }],
  },
]

async function seed() {
  const db = await pool.connect()
  try {
    await db.query('BEGIN')
    // Limpia datos previos (respetando FKs) y archivos en disco.
    await db.query('TRUNCATE documents, monthly_records, users, clients RESTART IDENTITY CASCADE')
    fs.rmSync(config.uploadDir, { recursive: true, force: true })

    // Admin Mantelek
    await db.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'admin')`,
      ['admin@mantelek.com', await hashPassword('admin1234'), 'Administrador Mantelek'],
    )

    for (const c of SEED) {
      const client = await db.query<{ id: string }>(
        `INSERT INTO clients
          (name, person_type, rfc, tax_regime, tax_address, phone, email, admin_contact,
           bank_name, bank_account, bank_clabe, constancia_updated_at, last_access_at, last_upload_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING id`,
        [
          c.name, c.personType, c.rfc, c.taxRegime, c.taxAddress, c.phone, c.email, c.adminContact,
          c.bank.name, c.bank.account, c.bank.clabe, c.constanciaUpdatedAt ?? null,
          c.lastAccessAt, c.lastUploadAt,
        ],
      )
      const clientId = client.rows[0].id

      await db.query(
        `INSERT INTO users (client_id, email, password_hash, full_name, role)
         VALUES ($1,$2,$3,$4,'client')`,
        [clientId, c.user.email, await hashPassword(c.user.password), c.user.fullName],
      )

      const defs = requiredDocuments(c.personType)
      for (const r of c.records) {
        const rec = await db.query<{ id: string }>(
          `INSERT INTO monthly_records (client_id, period, status, completed_at)
           VALUES ($1,$2,$3,$4) RETURNING id`,
          [clientId, r.period, r.status, r.completedAt ?? null],
        )
        const recordId = rec.rows[0].id
        for (const def of defs) {
          const isLoaded = r.loaded.includes(def.type)
          const file = isLoaded
            ? writePlaceholderPdf(clientId, r.period, def.file, `${def.label} — ${r.period}`)
            : null
          await db.query(
            `INSERT INTO documents (record_id, type, label, status, file_name, file_path, file_size, mime_type, uploaded_at, uploaded_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              recordId, def.type, def.label,
              isLoaded ? 'cargado' : 'pendiente',
              isLoaded ? `${def.file}.pdf` : null,
              file?.path ?? null,
              file?.size ?? null,
              isLoaded ? 'application/pdf' : null,
              isLoaded ? `${r.uploadDate}T10:30:00` : null,
              isLoaded ? c.adminContact : null,
            ],
          )
        }
        // Verificación de coherencia progreso/estatus en consola.
        const prog = computeProgress(defs.map((d) => ({ type: d.type, status: r.loaded.includes(d.type) ? 'cargado' : 'pendiente' })))
        console.log(`  ${c.name} · ${r.period}: ${r.status} (${prog}%)`)
      }
    }

    await db.query('COMMIT')
    console.log('✔ Datos de demo sembrados')
    console.log('  Cliente:  juan@soluciones.com / demo1234')
    console.log('  Admin:    admin@mantelek.com / admin1234')
  } catch (err) {
    await db.query('ROLLBACK')
    throw err
  } finally {
    db.release()
    await pool.end()
  }
}

seed().catch((err) => {
  console.error('Error en seed:', err)
  process.exit(1)
})
