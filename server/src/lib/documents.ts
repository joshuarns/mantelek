export type PersonType = 'fisica' | 'moral'
export type DocumentType =
  | 'opinion_cumplimiento'
  | 'constancia_situacion_fiscal'
  | 'estado_cuenta'
  | 'comprobante_domicilio'
  | 'caratula_bancaria'
  | 'otros'

interface DocDef {
  type: DocumentType
  label: string
  file: string
  appliesTo: PersonType[]
  optional?: boolean
}

/** Catálogo maestro de documentos (Módulos 2 y 3). */
export const DOC_CATALOG: DocDef[] = [
  {
    type: 'opinion_cumplimiento',
    label: 'Opinión de Cumplimiento del SAT',
    file: 'Opinion_de_Cumplimiento_del_SAT',
    appliesTo: ['fisica', 'moral'],
  },
  {
    type: 'constancia_situacion_fiscal',
    label: 'Constancia de Situación Fiscal',
    file: 'Constancia_de_Situacion_Fiscal',
    appliesTo: ['fisica', 'moral'],
  },
  {
    type: 'estado_cuenta',
    label: 'Estado de Cuenta Bancario',
    file: 'Estado_de_Cuenta_Bancario',
    appliesTo: ['fisica', 'moral'],
  },
  {
    type: 'comprobante_domicilio',
    label: 'Comprobante de Domicilio',
    file: 'Comprobante_de_Domicilio',
    appliesTo: ['fisica', 'moral'],
  },
  {
    type: 'caratula_bancaria',
    label: 'Carátula Bancaria',
    file: 'Caratula_Bancaria',
    appliesTo: ['moral'],
  },
  {
    type: 'otros',
    label: 'Otros Documentos',
    file: 'Otros_Documentos',
    appliesTo: ['fisica', 'moral'],
    optional: true,
  },
]

/** Documentos que le corresponden cargar a un tipo de persona. */
export function requiredDocuments(personType: PersonType): DocDef[] {
  return DOC_CATALOG.filter((d) => d.appliesTo.includes(personType))
}

export function docDef(type: string): DocDef | undefined {
  return DOC_CATALOG.find((d) => d.type === type)
}

/** Porcentaje de avance según documentos obligatorios cargados (Módulo 4). */
export function computeProgress(
  documents: { type: string; status: string }[],
): number {
  const core = documents.filter((d) => !docDef(d.type)?.optional)
  if (core.length === 0) return 0
  const loaded = core.filter((d) => d.status === 'cargado').length
  return Math.round((loaded / core.length) * 100)
}
