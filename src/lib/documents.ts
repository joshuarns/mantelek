import type { DocumentDef, DocumentType, PersonType } from './types'

/**
 * Catálogo maestro de documentos. El Módulo 2 (identificación automática)
 * determina qué documentos aplican según el tipo de persona.
 */
const ALL_DOCS: (DocumentDef & { appliesTo: PersonType[] })[] = [
  {
    type: 'opinion_cumplimiento',
    label: 'Opinión de Cumplimiento del SAT',
    appliesTo: ['fisica', 'moral'],
  },
  {
    type: 'constancia_situacion_fiscal',
    label: 'Constancia de Situación Fiscal',
    appliesTo: ['fisica', 'moral'],
  },
  {
    type: 'estado_cuenta',
    label: 'Estado de Cuenta Bancario',
    appliesTo: ['fisica', 'moral'],
  },
  {
    type: 'comprobante_domicilio',
    label: 'Comprobante de Domicilio',
    appliesTo: ['fisica', 'moral'],
  },
  {
    type: 'caratula_bancaria',
    label: 'Carátula Bancaria',
    appliesTo: ['moral'],
  },
  { type: 'otros', label: 'Otros Documentos', appliesTo: ['fisica', 'moral'] },
]

/** Documentos requeridos para un tipo de persona (Módulo 2). */
export function requiredDocuments(personType: PersonType): DocumentDef[] {
  return ALL_DOCS.filter((d) => d.appliesTo.includes(personType)).map(
    ({ type, label }) => ({ type, label }),
  )
}

/**
 * Documentos opcionales: no cuentan para el porcentaje de avance
 * (p. ej. "Otros Documentos" solo cuando Mantelek los solicita).
 */
export const OPTIONAL_DOCS: DocumentType[] = ['otros']

/** Porcentaje de avance a partir de los documentos obligatorios cargados. */
export function computeProgress(
  documents: { type: DocumentType; status: 'cargado' | 'pendiente' }[],
): number {
  const core = documents.filter((d) => !OPTIONAL_DOCS.includes(d.type))
  if (core.length === 0) return 0
  const loaded = core.filter((d) => d.status === 'cargado').length
  return Math.round((loaded / core.length) * 100)
}
