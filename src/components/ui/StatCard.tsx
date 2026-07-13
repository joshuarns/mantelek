import { StatusLight } from './StatusBadge'
import type { ComplianceStatus } from '../../lib/types'

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 90
  const h = 28
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - ((p - min) / range) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const SPARK_COLOR: Record<ComplianceStatus | 'total', string> = {
  total: '#64748b',
  cumplido: '#10b981',
  en_proceso: '#f59e0b',
  vencido: '#ef4444',
  sin_actividad: '#94a3b8',
}

export function StatCard({
  label,
  value,
  hint,
  status,
  trend,
}: {
  label: string
  value: number | string
  hint?: string
  status?: ComplianceStatus
  trend?: number[]
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        {status && <StatusLight status={status} />}
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      </div>
      <div className="mt-1 flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
        {trend && <Sparkline points={trend} color={SPARK_COLOR[status ?? 'total']} />}
      </div>
    </div>
  )
}
