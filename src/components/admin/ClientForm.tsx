import { useState } from 'react'
import { Check, Copy, KeyRound, Loader2, RefreshCw, X } from 'lucide-react'
import { api } from '../../lib/api'
import { generatePassword } from '../../lib/password'
import type { AdminClient, PersonType } from '../../lib/apiTypes'

const EMPTY = {
  name: '',
  personType: 'moral' as PersonType,
  rfc: '',
  taxRegime: '',
  taxAddress: '',
  phone: '',
  email: '',
  adminContact: '',
  bank: { bank: '', account: '', clabe: '' },
  user: { email: '', password: '', fullName: '' },
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  )
}

/**
 * Modal de alta (sin `client`) o edición (con `client`).
 * En alta también se crea el usuario de acceso al portal.
 */
export function ClientForm({
  client,
  onClose,
  onSaved,
}: {
  client?: AdminClient
  onClose: () => void
  onSaved: () => void
}) {
  const editing = Boolean(client)
  const [f, setF] = useState({
    ...EMPTY,
    ...(client && {
      name: client.name,
      personType: client.personType,
      rfc: client.rfc,
      email: client.email ?? '',
      adminContact: client.adminContact ?? '',
    }),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Restablecer contraseña (solo en modo edición). Vacío = no cambiarla.
  const [newPassword, setNewPassword] = useState('')
  const [copied, setCopied] = useState(false)

  function regenerate() {
    setNewPassword(generatePassword())
    setCopied(false)
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(newPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* el portapapeles puede estar bloqueado; el valor sigue visible */
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword && newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: f.name,
        personType: f.personType,
        rfc: f.rfc,
        taxRegime: f.taxRegime,
        taxAddress: f.taxAddress,
        phone: f.phone,
        email: f.email,
        adminContact: f.adminContact,
        bank: f.bank,
      }
      if (editing) {
        await api.put(`/admin/clients/${client!.id}`, payload)
        if (newPassword) {
          await api.patch(`/admin/clients/${client!.id}/password`, { password: newPassword })
        }
      } else {
        await api.post('/admin/clients', { ...payload, user: f.user })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {editing ? `Editar ${client!.name}` : 'Nuevo cliente'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Datos fiscales
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Field label="Nombre o Razón Social" value={f.name} required onChange={(v) => setF({ ...f, name: v })} />
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Tipo de persona <span className="text-red-500">*</span>
            </span>
            <select
              value={f.personType}
              onChange={(e) => setF({ ...f, personType: e.target.value as PersonType })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="moral">Persona Moral</option>
              <option value="fisica">Persona Física</option>
            </select>
          </label>
          <Field label="RFC" value={f.rfc} required placeholder="XAXX010101000" onChange={(v) => setF({ ...f, rfc: v })} />
          <Field label="Régimen Fiscal" value={f.taxRegime} onChange={(v) => setF({ ...f, taxRegime: v })} />
          <div className="sm:col-span-2">
            <Field label="Domicilio Fiscal" value={f.taxAddress} onChange={(v) => setF({ ...f, taxAddress: v })} />
          </div>
          <Field label="Teléfono" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
          <Field label="Correo de contacto" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} />
          <Field label="Contacto administrativo" value={f.adminContact} onChange={(v) => setF({ ...f, adminContact: v })} />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Datos bancarios
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Field label="Banco" value={f.bank.bank} onChange={(v) => setF({ ...f, bank: { ...f.bank, bank: v } })} />
          <Field label="Cuenta" value={f.bank.account} onChange={(v) => setF({ ...f, bank: { ...f.bank, account: v } })} />
          <Field label="CLABE" value={f.bank.clabe} onChange={(v) => setF({ ...f, bank: { ...f.bank, clabe: v } })} />
        </div>

        {!editing && (
          <>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Acceso al portal
            </p>
            <p className="text-xs text-slate-500">
              Con estos datos el cliente iniciará sesión. Compártelos con él de forma segura.
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <Field label="Nombre del usuario" value={f.user.fullName} required onChange={(v) => setF({ ...f, user: { ...f.user, fullName: v } })} />
              <Field label="Correo de acceso" type="email" value={f.user.email} required onChange={(v) => setF({ ...f, user: { ...f.user, email: v } })} />
              <Field label="Contraseña" type="text" value={f.user.password} required placeholder="mín. 8 caracteres" onChange={(v) => setF({ ...f, user: { ...f.user, password: v } })} />
            </div>
          </>
        )}

        {editing && (
          <>
            <p className="mt-5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <KeyRound size={13} /> Acceso al portal
            </p>
            {client!.userEmail && (
              <p className="text-xs text-slate-500">
                Inicia sesión con <span className="font-medium text-slate-700">{client!.userEmail}</span>.
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <label className="min-w-52 flex-1">
                <span className="text-xs font-medium text-slate-600">Nueva contraseña</span>
                <div className="mt-1 flex items-stretch overflow-hidden rounded-lg border border-slate-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                  <input
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setCopied(false)
                    }}
                    placeholder="Deja vacío para no cambiarla"
                    className="min-w-0 flex-1 px-3 py-2 text-sm focus:outline-none"
                  />
                  {newPassword && (
                    <button
                      type="button"
                      onClick={copyPassword}
                      title="Copiar"
                      className="flex items-center border-l border-slate-200 px-2.5 text-slate-500 hover:bg-slate-50"
                    >
                      {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                    </button>
                  )}
                </div>
              </label>
              <button
                type="button"
                onClick={regenerate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw size={14} /> Generar
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Al guardar se restablece la contraseña. Cópiala y compártela con el cliente: no se
              vuelve a mostrar.
            </p>
          </>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {editing ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}
