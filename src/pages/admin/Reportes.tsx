import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { ProgressBar } from '../../components/ui/Progress'
import { Loading, ErrorState } from '../../components/ui/States'
import { useFetch } from '../../hooks/useFetch'
import { periodLabel } from '../../lib/format'
import { recentPeriods } from '../../lib/periods'
import type { ReportsResponse } from '../../lib/apiTypes'

const PERIODS = recentPeriods()

export function Reportes() {
  const [period, setPeriod] = useState(PERIODS[0])
  const { data, loading, error, refetch } = useFetch<ReportsResponse>(
    `/admin/reports?period=${period}`,
  )

  if (loading) return <Loading />
  if (error || !data)
    return <ErrorState message={error ?? 'No se pudo cargar'} onRetry={refetch} />

  const maxTrend = Math.max(1, ...data.trend.map((t) => t.total))
  const maxBottleneck = Math.max(1, ...data.bottlenecks.map((b) => b.pendientes))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Indicadores de cumplimiento de la cartera.
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>
              {periodLabel(p)}
            </option>
          ))}
        </select>
      </div>

      {/* Evolución mensual */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <TrendingUp size={18} className="text-brand-600" /> Evolución del cumplimiento
        </h2>
        {data.trend.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Aún no hay periodos con datos.</p>
        ) : (
          <div className="mt-5 flex items-end gap-4 overflow-x-auto pb-2">
            {data.trend.map((t) => {
              const height = (t.total / maxTrend) * 120
              const cumplidoH = t.total ? (t.cumplido / t.total) * height : 0
              return (
                // Ancho fijo: con pocos meses una barra flexible se estiraría a
                // todo el ancho de la tarjeta y se vería mal.
                <div key={t.period} className="flex w-20 shrink-0 flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    {t.total ? Math.round((t.cumplido / t.total) * 100) : 0}%
                  </span>
                  <div
                    className="relative w-full rounded-t-lg bg-slate-100"
                    style={{ height: Math.max(height, 6) }}
                    title={`${t.cumplido} de ${t.total} cumplidos`}
                  >
                    <div
                      className="absolute bottom-0 w-full rounded-t-lg bg-emerald-500"
                      style={{ height: cumplidoH }}
                    />
                  </div>
                  <span className="whitespace-nowrap text-[11px] text-slate-500">
                    {t.label.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {t.cumplido}/{t.total}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Barra verde = clientes cumplidos sobre el total de cada mes.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Documentos que más se atoran */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">
            Documentos más pendientes · {data.label}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Dónde se atora la cartera este mes.
          </p>
          {data.bottlenecks.length === 0 ? (
            <p className="mt-4 text-sm text-emerald-600">
              No hay documentos pendientes este periodo.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.bottlenecks.map((b) => (
                <li key={b.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{b.label}</span>
                    <span className="font-semibold text-slate-900">{b.pendientes}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${(b.pendientes / maxBottleneck) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Por tipo de persona */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Por tipo de persona · {data.label}</h2>
          <p className="mt-0.5 text-xs text-slate-400">Avance promedio de cada segmento.</p>
          {data.byPersonType.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Sin clientes activos.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {data.byPersonType.map((b) => (
                <div key={b.personType}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      {b.personType === 'moral' ? 'Persona Moral' : 'Persona Física'}
                      <span className="ml-2 text-xs text-slate-400">
                        {b.cumplido} de {b.total} cumplidos
                      </span>
                    </span>
                    <span className="font-semibold text-slate-900">{b.avgProgress}%</span>
                  </div>
                  <ProgressBar value={b.avgProgress} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
