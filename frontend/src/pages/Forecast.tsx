import { useNavigate } from 'react-router-dom'
import { MapPin, Sun, Wind, Cloud, Cpu, Sparkles } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ForecastAreaChart } from '@/components/charts/ForecastAreaChart'
import { ForecastSummaryTable } from '@/features/forecast/ForecastSummaryTable'
import { HourlyDataTable } from '@/features/forecast/HourlyDataTable'
import { useSiteStore } from '@/store/useSiteStore'
import { useForecastStore } from '@/store/useForecastStore'

export default function Forecast() {
  const navigate = useNavigate()
  const site = useSiteStore((s) => s.selectedSite)
  const forecast = useForecastStore((s) => s.forecast)

  // ─── No site selected → empty state ────────────────────────────
  if (!site) {
    return (
      <PageWrapper>
        <Card>
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <MapPin size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              No site selected
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Configure a site on the Map View and run a forecast to see the
              72-hour generation curve.
            </p>
            <Button className="mt-5" onClick={() => navigate('/map')}>
              Go to Map View
            </Button>
          </div>
        </Card>
      </PageWrapper>
    )
  }

  // ─── Determine asset type + forecast series ─────────────────────
  const isWind = site.assetParams.type === 'wind'
  const assetType: 'solar' | 'wind' = isWind ? 'wind' : 'solar'
  const series = isWind ? forecast?.wind : forecast?.solar
  const hasData = !!series && series.length > 0

  // ─── Provenance tags — asset-specific ───────────────────────────
  const provenanceTags = isWind
    ? [
        { icon: <Cloud size={10} />, label: 'Open-Meteo' },
        { icon: <Cpu size={10} />, label: 'Power curve' },
        { icon: <Sparkles size={10} />, label: 'Log law + density' },
      ]
    : [
        { icon: <Cloud size={10} />, label: 'Open-Meteo' },
        { icon: <Cpu size={10} />, label: 'pvlib baseline' },
        { icon: <Sparkles size={10} />, label: 'XGBoost correction' },
      ]

  return (
    <PageWrapper className="space-y-6">
      {/* ── Site header ─────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isWind
                  ? 'bg-sky-50 text-sky-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              <MapPin size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-semibold text-slate-900">
                  {site.name}
                </h2>
                <Badge variant={isWind ? 'success' : 'warning'}>
                  <span className="inline-flex items-center gap-1">
                    {isWind ? <Wind size={10} /> : <Sun size={10} />}
                    {isWind ? 'Wind' : 'Solar'}
                  </span>
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)} ·{' '}
                {site.gis.panchayat}, {site.gis.block}, {site.gis.district}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigate('/profile')}>
            Change Site
          </Button>
        </div>
      </Card>

      {/* ── Chart card ──────────────────────────────────────── */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <CardTitle>
            {isWind ? '72-Hour Wind Forecast' : '72-Hour Solar Forecast'}
          </CardTitle>

          {/* Inline provenance pills — no external prop dependency */}
          <div className="flex flex-wrap items-center gap-2">
            {provenanceTags.map((tag) => (
              <span
                key={tag.label}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600"
              >
                {tag.icon}
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {hasData ? (
          <ForecastAreaChart data={series!} />
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            <div className="text-center">
              <p className="font-medium text-slate-500">
                No forecast data available
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Run the forecast again from the Map View.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => navigate('/map')}
              >
                Go to Map View
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Summary + Hourly Data (only when summary exists) ── */}
      {hasData && forecast?.summary && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <ForecastSummaryTable summary={forecast.summary} />
          <HourlyDataTable
            data={series ?? []}
            weatherKind={isWind ? 'wind' : 'ghi'}
          />
        </div>
      )}
    </PageWrapper>
  )
}