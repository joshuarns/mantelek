import { query } from '../db/pool.js'

export interface ClientRow {
  id: string
  name: string
  person_type: 'fisica' | 'moral'
  rfc: string
  tax_regime: string | null
  tax_address: string | null
  phone: string | null
  email: string | null
  admin_contact: string | null
  bank_name: string | null
  bank_account: string | null
  bank_clabe: string | null
  constancia_updated_at: string | null
  last_access_at: string | null
  last_upload_at: string | null
}

const CLIENT_COLUMNS = `
  id, name, person_type, rfc, tax_regime, tax_address, phone, email,
  admin_contact, bank_name, bank_account, bank_clabe,
  constancia_updated_at, last_access_at, last_upload_at
`

export async function getClient(id: string): Promise<ClientRow | undefined> {
  const { rows } = await query<ClientRow>(
    `SELECT ${CLIENT_COLUMNS} FROM clients WHERE id = $1`,
    [id],
  )
  return rows[0]
}

export function serializeClient(c: ClientRow) {
  return {
    id: c.id,
    name: c.name,
    personType: c.person_type,
    rfc: c.rfc,
    taxRegime: c.tax_regime,
    taxAddress: c.tax_address,
    phone: c.phone,
    email: c.email,
    adminContact: c.admin_contact,
    bank: {
      bank: c.bank_name,
      account: c.bank_account,
      clabe: c.bank_clabe,
    },
    constanciaUpdatedAt: c.constancia_updated_at,
    lastAccessAt: c.last_access_at,
    lastUploadAt: c.last_upload_at,
  }
}
