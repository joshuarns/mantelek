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

export type NotificationKind = 'dia_10' | 'dia_15' | 'dia_20' | 'completado'

export interface NotificationDTO {
  id: string
  period: string
  kind: NotificationKind
  channel: 'email' | 'whatsapp'
  subject: string | null
  message: string
  /** "enviado" | "simulado" (sin proveedor configurado aún) */
  status: string
  sentAt: string
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
  active: boolean
  /** Correo con el que el cliente entra al portal. */
  userEmail: string | null
  status: ComplianceStatus
  progress: number
  pending: number
  lastAccessAt: string | null
  lastUploadAt: string | null
}

/** Datos del formulario de alta/edición de cliente. */
export interface ClientInput {
  name: string
  personType: PersonType
  rfc: string
  taxRegime: string
  taxAddress: string
  phone: string
  email: string
  adminContact: string
  bank: { bank: string; account: string; clabe: string }
}

export interface CreateClientInput extends ClientInput {
  user: { email: string; password: string; fullName: string }
}
