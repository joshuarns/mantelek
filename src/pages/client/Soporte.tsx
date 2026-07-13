import { Mail, MessageCircle, Phone } from 'lucide-react'

const CHANNELS = [
  { icon: Phone, label: 'Teléfono', value: '55 1234 5678' },
  { icon: Mail, label: 'Correo electrónico', value: 'soporte@mantelek.com' },
  { icon: MessageCircle, label: 'WhatsApp', value: '55 1234 5678' },
]

const FAQ = [
  {
    q: '¿Qué documentos debo cargar cada mes?',
    a: 'El sistema muestra automáticamente los documentos que te corresponden según tu tipo de persona (Física o Moral).',
  },
  {
    q: '¿Hasta qué día puedo cargar mi documentación?',
    a: 'La fecha límite es el día 20 de cada mes. Recibirás recordatorios los días 10, 15 y 20.',
  },
  {
    q: '¿Puedo actualizar un documento ya cargado?',
    a: 'Sí, puedes ingresar las veces que necesites durante el mes hasta completar tu expediente.',
  },
]

export function Soporte() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Soporte</h1>
      <p className="mt-1 text-sm text-slate-500">
        ¿Necesitas ayuda? Contáctanos por cualquiera de estos medios.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {CHANNELS.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
              <Icon size={20} />
            </div>
            <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">{label}</p>
            <p className="text-sm font-semibold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Preguntas frecuentes</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {FAQ.map((f) => (
            <div key={f.q} className="py-3">
              <p className="text-sm font-medium text-slate-800">{f.q}</p>
              <p className="mt-1 text-sm text-slate-600">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
