import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Download, Loader2, Trash2 } from 'lucide-react'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import type { MeResponse } from '../../lib/apiTypes'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value}</p>
    </div>
  )
}

export function VistaDocumento() {
  const { type } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useFetch<MeResponse>('/me')
  const [deleting, setDeleting] = useState(false)

  if (loading) return <Loading />
  if (error || !data)
    return <ErrorState message={error ?? 'No se pudo cargar'} onRetry={refetch} />

  const record = data.currentRecord
  const doc = record.documents.find((d) => d.type === type)

  if (!doc || doc.status !== 'cargado') {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-slate-500">Documento no encontrado o aún no cargado.</p>
        <Link to="/documentos" className="text-brand-600 hover:underline">
          ← Volver a documentos
        </Link>
      </div>
    )
  }

  async function handleDelete() {
    if (!doc || !confirm(`¿Eliminar "${doc.label}"?`)) return
    setDeleting(true)
    try {
      await api.del(`/documents/${data!.currentPeriod}/${doc.type}`)
      navigate('/documentos')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav className="flex items-center gap-1 text-sm text-slate-500">
          <Link to="/documentos" className="hover:text-brand-600">
            Documentos del Mes
          </Link>
          <ChevronRight size={14} />
          <span>{record.label}</span>
          <ChevronRight size={14} />
          <span className="font-medium text-slate-800">{doc.label}</span>
        </nav>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
        >
          {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Eliminar
        </button>
      </div>

      <h1 className="mt-4 text-2xl font-bold text-slate-900">{doc.label}</h1>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-6">
            <div className="mb-6 text-2xl font-bold text-blue-800">PDF</div>
            <div className="space-y-2.5">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 rounded bg-slate-200"
                  style={{ width: `${60 + ((i * 7) % 40)}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Información del documento</h2>
          <InfoRow label="Nombre del archivo" value={doc.fileName ?? '—'} />
          <InfoRow label="Fecha de carga" value={formatDateTime(doc.uploadedAt)} />
          <InfoRow label="Cargado por" value={doc.uploadedBy ?? '—'} />
          <InfoRow label="Mes correspondiente" value={record.label} />
          <InfoRow label="Tamaño del archivo" value={doc.fileSize ?? '—'} />

          <button
            onClick={() => api.download(`/documents/${doc.id}/download`, doc.fileName ?? 'documento')}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            <Download size={16} /> Descargar
          </button>
        </div>
      </div>
    </div>
  )
}
