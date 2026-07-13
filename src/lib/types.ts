// Tipos de dominio del portal de cumplimiento Mantelek

export type PersonType = 'fisica' | 'moral'

export type ComplianceStatus =
  | 'cumplido'
  | 'en_proceso'
  | 'vencido'
  | 'sin_actividad'

export type DocumentStatus = 'cargado' | 'pendiente'

/** Catálogo de documentos que puede requerir Mantelek. */
export type DocumentType =
  | 'opinion_cumplimiento'
  | 'constancia_situacion_fiscal'
  | 'estado_cuenta'
  | 'comprobante_domicilio'
  | 'caratula_bancaria'
  | 'otros'

export interface DocumentDef {
  type: DocumentType
  label: string
}

export interface MonthlyDocument {
  type: DocumentType
  label: string
  status: DocumentStatus
  /** ISO string de la fecha/hora de carga, si aplica. */
  uploadedAt?: string
  fileName?: string
  fileSize?: string
  uploadedBy?: string
}

export interface MonthlyRecord {
  /** Clave del periodo, p. ej. "2026-07". */
  period: string
  label: string // "Julio 2026"
  status: ComplianceStatus
  progress: number // 0-100
  completedAt?: string // ISO fecha de cumplimiento
  documents: MonthlyDocument[]
}

export interface BankInfo {
  bank: string
  account: string
  clabe: string
}

export interface Client {
  id: string
  name: string // Nombre o Razón Social
  personType: PersonType
  rfc: string
  taxRegime: string
  taxAddress: string
  phone: string
  email: string
  adminContact: string
  bank: BankInfo
  constanciaUpdatedAt?: string
  lastAccessAt?: string
  lastUploadAt?: string
  /** Registros mensuales, del más reciente al más antiguo. */
  records: MonthlyRecord[]
}

export interface NotificationItem {
  id: string
  day: 10 | 15 | 20 | 'completado'
  title: string
  message: string
  sentAt: string // ISO
  tone: 'info' | 'warning' | 'danger' | 'success'
}
