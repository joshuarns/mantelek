// Formas de datos que devuelve la API de Mantelek.
import type { ComplianceStatus, DocumentStatus, PersonType } from './types'

export type { ComplianceStatus, DocumentStatus, PersonType }

export interface ClientDTO {
  id: string
  name: string
  personType: PersonType
  rfc: string
  taxRegime: string | null
  taxAddress: string | null
  phone: string | null
  email: string | null
  adminContact: string | null
  bank: { bank: string | null; account: string | null; clabe: string | null }
  constanciaUpdatedAt: string | null
  lastAccessAt: string | null
  lastUploadAt: string | null
}

export interface DocumentDTO {
  id: string
  type: string
  label: string
  status: DocumentStatus
  fileName: string | null
  fileSize: string | null
  uploadedAt: string | null
  uploadedBy: string | null
}

export interface RecordDTO {
  period: string
  label: string
  status: ComplianceStatus
  progress: number
  completedAt: string | null
  documents: DocumentDTO[]
}

export interface MeResponse {
  client: ClientDTO
  currentPeriod: string
  deadlineDay: number
  currentRecord: RecordDTO
}

export interface HistoryItem {
  period: string
  label: string
  status: ComplianceStatus
  progress: number
  completedAt: string | null
}

export interface AdminStats {
  total: number
  cumplido: number
  en_proceso: number
  vencido: number
  sin_actividad: number
}

export interface AdminClient {
  id: string
  name: string
  personType: PersonType
  rfc: string
  email: string | null
  adminContact: string | null
  status: ComplianceStatus
  progress: number
  pending: number
  lastAccessAt: string | null
  lastUploadAt: string | null
}
