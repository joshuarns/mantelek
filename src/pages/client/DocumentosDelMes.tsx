import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Download, Eye, Info, Loader2, Trash2, Upload } from 'lucide-react'
import { ProgressBar } from '../../components/ui/Progress'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { MeResponse, RecordDTO } from '../../lib/apiTypes'

export function DocumentosDelMes() {
  const { data, loading, error, refetch } = useFetch<MeResponse>('/me')
  const [record, setRecord] = useState<RecordDTO | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const pendingType = useRef<string | null>(null)

  // Sincroniza el estado local editable con la respuesta del servidor.
  const current = record ?? data?.currentRecord ?? null

  if (loading) return <Loading />
  if (error || !data || !current)
    return <ErrorState message={error ?? 'No se pudo cargar'} onRetry={refetch} />

  const period = data.currentPeriod

  function pickFile(type: string) {
    pendingType.current = type
    setUploadError(null)
    fileInput.current?.click()
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const type = pendingType.current
    e.target.value = '' // permite re-seleccionar el mismo archivo
    if (!file || !type) return

    setUploading(type)
    setUploadError(null)
    try {
      const updated = await api.upload<RecordDTO>(`/documents/${period}/${type}`, file)
      setRecord(updated)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'No se pudo cargar el archivo')
    } finally {
      setUploading(null)
    }
  }

  // Borra un documento cargado por error. Vuelve a quedar pendiente para
  // que el cliente lo cargue de nuevo.
  async function handleDelete(type: string, label: string) {
    if (!confirm(`¿Eliminar "${label}"? Podrás volver a cargarlo.`)) return
    setDeleting(type)
    setUploadError(null)
    try {
      const updated = await api.del<RecordDTO>(`/documents/${period}/${type}`)
      setRecord(updated)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'No se pudo eliminar el archivo')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={onFileSelected}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Documentos de {current.label}</h1>
        <p className="text-sm text-slate-500">
          Fecha límite: <span className="font-semibold text-red-600">20 de {current.label}</span>
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Avance general</span>
            <span className="font-semibold text-slate-900">{current.progress}%</span>
          </div>
          <ProgressBar value={current.progress} />
        </div>

        {uploadError && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{uploadError}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Documento</th>
                <th className="pb-2 font-medium">Estatus</th>
                <th className="pb-2 text-right font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {current.documents.map((d) => (
                <tr key={d.type}>
                  <td className="py-3 font-medium text-slate-800">{d.label}</td>
                  <td className="py-3">
                    {d.status === 'cargado' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 size={15} />
                        Cargado el {formatDate(d.uploadedAt)}
                      </span>
                    ) : (
                      <span className="font-medium text-amber-600">Pendiente</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-2">
                      {d.status === 'cargado' ? (
                        <>
                          <Link
                            to={`/documentos/${d.type}`}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                            title="Ver documento"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => api.download(`/documents/${d.id}/download`, d.fileName ?? 'documento')}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                            title="Descargar"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(d.type, d.label)}
                            disabled={deleting === d.type}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Eliminar y volver a cargar"
                          >
                            {deleting === d.type ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => pickFile(d.type)}
                          disabled={uploading === d.type}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                        >
                          {uploading === d.type ? (
                            <>
                              <Loader2 size={14} className="animate-spin" /> Subiendo…
                            </>
                          ) : (
                            <>
                              <Upload size={14} /> Cargar
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand-500/5 p-3 text-sm text-brand-700">
          <Info size={16} />
          Puedes ingresar las veces que necesites. Si subiste un archivo por error, elimínalo con
          la papelera y vuelve a cargarlo.
        </div>
      </div>
    </div>
  )
}
