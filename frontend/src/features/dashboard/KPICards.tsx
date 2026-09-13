import React from 'react'
import {
  Cloud,
  Sun,
  Wind,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { DataProvenanceBadge } from '@/components/provenance/DataProvenanceBadge'
import type {
  CurrentWeather,
  ForecastResponse,
  DecisionResponse,
} from '@/lib/types'

interface KPICardsProps {
  weather: CurrentWeather | undefined
  weatherLoading: boolean
  forecast: ForecastResponse | null
  decision: DecisionResponse | null
  /** Optional explicit override. If unset, auto-detected from forecast data. */
  assetType?: 'solar' | 'wind'
}

export function KPICards({
  weather,
  weatherLoading,
  forecast,
  decision,
  assetType,
}: KPICardsProps) {
  // ─── 24h totals ─────────────────────────────────────────────
  const solar24 = forecast?.solar
    ? forecast.solar.slice(0, 24).reduce((s, h) => s + (h.expectedMW ?? 0), 0)
    : 0
  const wind24 = forecast?.wind
    ? forecast.wind.slice(0, 24).reduce((s, h) => s + (h.expectedMW ?? 0), 0)
    : 0

  // ─── Resolve which asset type to display ────────────────────
  // Priority:
  //   1. Explicit assetType prop (from Dashboard)
  //   2. Auto-detect from forecast data (if wind > 0 → wind, else if solar > 0 → solar)
  //   3. Fallback to "both"
  let effectiveAsset: 'solar' | 'wind' | 'both' = 'both'

  if (assetType) {
    effectiveAsset = assetType
  } else if (forecast) {
    const hasWindData = !!forecast.wind && forecast.wind.length > 0
    const hasSolarData = !!forecast.solar && forecast.solar.length > 0
    const windNonZero = hasWindData && wind24 > 0.01
    const solarNonZero = hasSolarData && solar24 > 0.01

    if (windNonZero && !solarNonZero) {
      effectiveAsset = 'wind'
    } else if (solarNonZero && !windNonZero) {
      effectiveAsset = 'solar'
    } else if (windNonZero && solarNonZero) {
      // Both have real data — show both
      effectiveAsset = 'both'
    } else if (hasWindData && !hasSolarData) {
      effectiveAsset = 'wind'
    } else if (hasSolarData && !hasWindData) {
      effectiveAsset = 'solar'
    }
  }

  const showSolar = effectiveAsset === 'solar' || effectiveAsset === 'both'
  const showWind = effectiveAsset === 'wind' || effectiveAsset === 'both'
  const bothVisible = showSolar && showWind

  const displayedTotal =
    (showSolar ? solar24 : 0) + (showWind ? wind24 : 0)

  const pct = (v: number) =>
    displayedTotal > 0 ? Math.round((v / displayedTotal) * 100) : 0

  const gridStatus = decision?.status ?? 'normal'

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* ── Card 1: Current Weather ─────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Current Weather (Gujarat)</CardTitle>
          <DataProvenanceBadge type="model-derived" />
        </CardHeader>

        {weatherLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-semibold text-slate-900">
              {weather?.tempC?.toFixed(1) ?? '—'}°C
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {weather?.condition ?? 'Unknown'}
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <div className="flex items-center justify-end gap-2">
                <Wind size={11} />
                {weather?.windSpeedMs?.toFixed(2) ?? '—'} m/s
              </div>
              <div className="flex items-center justify-end gap-2">
                <Cloud size={11} />
                {weather?.humidityPct?.toFixed(0) ?? '—'}%
              </div>
              <div className="flex items-center justify-end gap-2">
                <Sun size={11} />
                GHI {weather?.ghi?.toFixed(0) ?? '—'} W/m²
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ── Card 2: Total Generation ────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Total Generation Next 24h</CardTitle>
          <DataProvenanceBadge type="model-derived" />
        </CardHeader>

        {!forecast ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <div
            className={`grid gap-2 ${
              bothVisible ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {showSolar && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                  <Sun size={12} />
                  Solar
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {solar24.toFixed(1)} MW
                </div>
                {bothVisible && (
                  <div className="mt-0.5 text-[10px] text-amber-600">
                    {pct(solar24)}%
                  </div>
                )}
              </div>
            )}

            {showWind && (
              <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-sky-700">
                  <Wind size={12} />
                  Wind
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {wind24.toFixed(1)} MW
                </div>
                {bothVisible && (
                  <div className="mt-0.5 text-[10px] text-sky-600">
                    {pct(wind24)}%
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Card 3: Grid Status ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Grid Status</CardTitle>
        </CardHeader>

        <div className="flex items-center gap-2">
          {gridStatus === 'surplus' && (
            <Badge variant="warning">
              <span className="inline-flex items-center gap-1">
                <TrendingUp size={11} />
                Surplus
              </span>
            </Badge>
          )}
          {gridStatus === 'shortfall' && (
            <Badge variant="danger">
              <span className="inline-flex items-center gap-1">
                <TrendingDown size={11} />
                Shortfall
              </span>
            </Badge>
          )}
          {gridStatus === 'normal' && (
            <Badge variant="success">
              <span className="inline-flex items-center gap-1">
                <AlertCircle size={11} />
                Normal
              </span>
            </Badge>
          )}
        </div>

        <p className="mt-2 text-xs text-slate-500">
          {decision?.recommendations?.length
            ? `${decision.recommendations.length} recommended action window(s) in the next 72h.`
            : 'No action windows detected.'}
        </p>
      </Card>
    </div>
  )
}