import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Sun, Wind, Plus, ArrowRight, Clock, Zap, Sliders } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KPICards } from '@/features/dashboard/KPICards'
import { QuickActions } from '@/features/dashboard/QuickActions'
import { AlertsFeed } from '@/features/dashboard/AlertsFeed'
import { useCurrentWeather } from '@/hooks/useWeather'
import { useAlerts } from '@/hooks/useForecast'
import { useAuthStore } from '@/store/useAuthStore'
import { useSiteStore } from '@/store/useSiteStore'
import { useForecastStore } from '@/store/useForecastStore'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const selectedSite = useSiteStore((s) => s.selectedSite)
  const forecast = useForecastStore((s) => s.forecast)
  const decision = useForecastStore((s) => s.decision)

  const lat = selectedSite?.latitude ?? 22.6
  const lon = selectedSite?.longitude ?? 71.6

  const { data: weather, isLoading: weatherLoading } = useCurrentWeather(lat, lon)
  const { data: alerts, isLoading: alertsLoading } = useAlerts()

  const isWind = selectedSite?.assetParams?.type === 'wind'
  const assetType: 'solar' | 'wind' | undefined = selectedSite
    ? isWind
      ? 'wind'
      : 'solar'
    : undefined

  // existing forecast store data, no new fetching/state.
  const shortHorizon = (forecast?.combined ?? forecast?.solar ?? forecast?.wind ?? []).slice(0, 6)

  // ════════════════════════════════════════════════════════════════
  // EMPTY STATE — shown on first login or when no site is selected.
  // ════════════════════════════════════════════════════════════════
  if (!selectedSite) {
    return (
      <PageWrapper className="space-y-3">
        {/* Compact hero band */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 border border-slate-200/80 px-5 py-5">
          <svg
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 opacity-25"
            viewBox="0 0 200 200"
            aria-hidden="true"
          >
            <circle cx="100" cy="100" r="100" fill="#FCD34D" opacity="0.35" />
          </svg>

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 shadow-md shadow-emerald-600/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
                Welcome to UrjaCast
              </p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">
                Configure your first site
              </h1>
              <p className="mt-1 text-sm leading-snug text-slate-600">
                Forecast renewable generation at any site in Gujarat. Select a
                location on the map — we'll resolve its Panchayat and terrain
                context automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Compact 3-step grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <CompactStepCard
            number={1}
            icon={<MapPin className="h-4 w-4" />}
            title="Select a site"
            description="Click anywhere on the map. The GIS layer resolves State → District → Block → Panchayat."
          />
          <CompactStepCard
            number={2}
            icon={<Sliders className="h-4 w-4" />}
            title="Configure the asset"
            description="Enter DC capacity, tilt, and azimuth for solar — or turbine specs for wind."
          />
          <CompactStepCard
            number={3}
            icon={<Zap className="h-4 w-4" />}
            title="Get the forecast"
            description="72-hour MW prediction with P10/P90 bands and surplus/shortfall recommendations."
          />
        </div>

        {/* CTA — inline, compact */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <Button
            onClick={() => navigate('/map')}
            className="group flex items-center gap-2 bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700"
          >
            Configure your first site
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <p className="text-[11px] text-slate-400">
            Gujarat pilot region · 72-hour forecast horizon · Physics + ML
          </p>
        </div>
      </PageWrapper>
    )
  }

  // ════════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════════
  return (
    <PageWrapper className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 border border-slate-200/80 px-5 py-4 md:px-7 md:py-5">
        <svg
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 opacity-30"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="100" fill="#FCD34D" opacity="0.35" />
        </svg>

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Welcome text — small, top-anchored, not a headline */}
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Overview
            </span>
            <span className="text-slate-300">·</span>
            <p className="truncate text-sm font-medium text-slate-600">
              Welcome back, <span className="font-semibold text-slate-900">{user?.name || 'there'}</span>
            </p>
          </div>

          {/* Current site status, inline instead of its own card */}
          {selectedSite ? (
            <div className="flex min-w-0 items-center gap-3 lg:border-l lg:border-slate-200 lg:pl-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isWind ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'
                }`}
              >
                {isWind ? <Wind size={18} /> : <Sun size={18} />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                    Viewing
                  </p>
                  <Badge variant={isWind ? 'success' : 'warning'}>
                    <span className="inline-flex items-center gap-1">
                      {isWind ? <Wind size={9} /> : <Sun size={9} />}
                      {isWind ? 'Wind' : 'Solar'}
                    </span>
                  </Badge>
                </div>
                <h3 className="truncate text-sm font-bold tracking-tight text-slate-900">
                  {selectedSite.name}
                </h3>
                <p className="truncate text-[11px] text-slate-500">
                  <MapPin size={9} className="mr-1 inline" />
                  {selectedSite.gis.panchayat}, {selectedSite.gis.district}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => navigate('/map')}>
                  Change
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/forecast')}
                  aria-label="View forecast"
                >
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-3 lg:border-l lg:border-slate-200 lg:pl-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                <MapPin size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  No site selected yet
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  Configure your first renewable site
                </p>
              </div>
              <Button size="sm" onClick={() => navigate('/map')}>
                <Plus size={14} />
                Configure Site
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────── */}
      <KPICards
        weather={weather}
        weatherLoading={weatherLoading}
        forecast={forecast}
        decision={decision}
        assetType={assetType}
        locationLabel={
          selectedSite
            ? selectedSite.gis.panchayat
              ? `${selectedSite.gis.panchayat}, ${selectedSite.gis.block}`
              : selectedSite.gis.block || selectedSite.gis.district || 'Gujarat'
            : 'Gujarat'
        }
      />

      {/* ── Next few hours + Quick actions side by side  */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="rounded-3xl lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Clock size={16} />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-900">
                  Next few hours
                </h3>
                <p className="text-xs text-slate-400">
                  Expected generation, hour by hour
                </p>
              </div>
            </div>
            <Badge variant="default">3–6h view</Badge>
          </div>

          {shortHorizon.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
              Run a forecast to see the next few hours here.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {shortHorizon.map((h, i) => {
                const hourLabel = new Date(h.time).toLocaleTimeString([], {
                  hour: 'numeric',
                })
                const tone =
                  h.status === 'surplus'
                    ? 'bg-amber-50 border-amber-100 text-amber-700'
                    : h.status === 'shortfall'
                    ? 'bg-rose-50 border-rose-100 text-rose-700'
                    : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                return (
                  <div
                    key={i}
                    className={`rounded-2xl border p-3 text-center ${tone}`}
                  >
                    <div className="text-[10px] font-medium uppercase tracking-wide opacity-70">
                      {hourLabel}
                    </div>
                    <div className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                      {h.expectedMW.toFixed(1)}
                      <span className="ml-0.5 text-xs font-medium text-slate-500">
                        MW
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => navigate('/forecast')}>
              View more
              <ArrowRight size={14} />
            </Button>
          </div>
        </Card>

        {/* Quick actions moved beside the forecast card, in its own
            column, instead of stacked full-width below. */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>

      <AlertsFeed alerts={alerts} isLoading={alertsLoading} />
    </PageWrapper>
  )
}

// ════════════════════════════════════════════════════════════════════
// Compact step card — used only in the empty state.
// ════════════════════════════════════════════════════════════════════
function CompactStepCard({
  number,
  icon,
  title,
  description,
}: {
  number: number
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="rounded-2xl">
      <div className="mb-2.5 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
          {number}
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          {icon}
        </div>
      </div>
      <h3 className="mb-1 text-sm font-semibold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="text-xs leading-snug text-slate-600">{description}</p>
    </Card>
  )
}