import { useState } from 'react'
import { CheckCircle2, Pencil, Save, X } from 'lucide-react'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { ClientDTO, MeResponse } from '../../lib/apiTypes'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{children}</p>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  )
}

export function InformacionGeneral() {
  const { data, loading, error, refetch } = useFetch<MeResponse>('/me')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<ClientDTO>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (loading) return <Loading />
  if (error || !data)
    return <ErrorState message={error ?? 'No se pudo cargar'} onRetry={refetch} />

  const c = data.client

  function startEdit() {
    setForm({
      taxRegime: c.taxRegime ?? '',
      taxAddress: c.taxAddress ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      adminContact: c.adminContact ?? '',
      bank: { ...c.bank },
    })
    setSaveError(null)
    setEditing(true)
  }

  async function save() {
    setSaving(true)
    setSaveError(null)
    try {
      await api.put('/me', form)
      setEditing(false)
      refetch()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Información General</h1>
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <X size={15} /> Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              <Save size={15} /> {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        ) : (
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            <Pencil size={15} /> Editar información
          </button>
        )}
      </div>

      {saveError && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</div>
      )}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
        {editing ? (
          <div className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
            <Input label="Correo Electrónico" value={form.email ?? ''} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
            <Input label="Teléfono" value={form.phone ?? ''} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
            <Input label="Contacto Administrativo" value={form.adminContact ?? ''} onChange={(v) => setForm((f) => ({ ...f, adminContact: v }))} />
            <Input label="Régimen Fiscal" value={form.taxRegime ?? ''} onChange={(v) => setForm((f) => ({ ...f, taxRegime: v }))} />
            <div className="sm:col-span-2">
              <Input label="Domicilio Fiscal" value={form.taxAddress ?? ''} onChange={(v) => setForm((f) => ({ ...f, taxAddress: v }))} />
            </div>
            <Input label="Banco" value={form.bank?.bank ?? ''} onChange={(v) => setForm((f) => ({ ...f, bank: { ...f.bank!, bank: v } }))} />
            <Input label="Cuenta" value={form.bank?.account ?? ''} onChange={(v) => setForm((f) => ({ ...f, bank: { ...f.bank!, account: v } }))} />
            <Input label="CLABE" value={form.bank?.clabe ?? ''} onChange={(v) => setForm((f) => ({ ...f, bank: { ...f.bank!, clabe: v } }))} />
            <p className="self-end text-xs text-slate-400">
              El RFC, razón social y tipo de persona se modifican con Mantelek.
            </p>
          </div>
        ) : (
          <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            <Field label="Tipo de persona">
              {c.personType === 'moral' ? 'Persona Moral' : 'Persona Física'}
            </Field>
            <Field label="Correo Electrónico">{c.email}</Field>
            <Field label="Razón Social">{c.name}</Field>
            <Field label="Contacto Administrativo">{c.adminContact}</Field>
            <Field label="RFC">{c.rfc}</Field>
            <Field label="Datos Bancarios">
              <span className="block">Banco: {c.bank.bank}</span>
              <span className="block">Cuenta: {c.bank.account}</span>
              <span className="block">CLABE: {c.bank.clabe}</span>
            </Field>
            <Field label="Régimen Fiscal">{c.taxRegime}</Field>
            <Field label="Constancia de Situación Fiscal">
              {c.constanciaUpdatedAt ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 size={15} /> Actualizada
                  <span className="text-slate-400">({formatDate(c.constanciaUpdatedAt)})</span>
                </span>
              ) : (
                <span className="text-amber-600">Pendiente</span>
              )}
            </Field>
            <Field label="Domicilio Fiscal">{c.taxAddress}</Field>
            <Field label="Teléfono">{c.phone}</Field>
          </div>
        )}
      </div>
    </div>
  )
}
