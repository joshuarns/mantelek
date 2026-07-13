import { Construction } from 'lucide-react'

export function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <Construction size={24} />
        </div>
        <p className="mt-3 font-medium text-slate-700">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
        <span className="mt-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          Pendiente de conectar al backend
        </span>
      </div>
    </div>
  )
}
