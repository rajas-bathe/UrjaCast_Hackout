import React from 'react'
import { Sun, Wind } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { DataProvenanceBadge } from '@/components/provenance/DataProvenanceBadge'
import type { ForecastResponse } from '@/lib/types'
import { formatMW } from '@/lib/utils'

interface GenerationSummaryCardProps {
  forecast: ForecastResponse | null
}

export function GenerationSummaryCard({ forecast }: GenerationSummaryCardProps) {
  const solarPeak = forecast?.solar ? Math.max(...forecast.solar.slice(0, 24).map((h) => h.expectedMW)) : 0
  const windPeak = forecast?.wind ? Math.max(...forecast.wind.slice(0, 24).map((h) => h.expectedMW)) : 0
  const total = solarPeak + windPeak
  const solarPct = total > 0 ? Math.round((solarPeak / total) * 100) : 0
  const windPct = total > 0 ? 100 - solarPct : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Generation Next 24h</CardTitle>
        <DataProvenanceBadge type="model-derived" />
      </CardHeader>
      {!forecast ? (
        <p className="text-xs text-slate-400">Run a forecast on the Map View to populate this card.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-amber-50 p-3">
            <div className="flex items-center gap-1.5 text-amber-600">
              <Sun size={14} />
              <span className="text-xs font-medium">Solar</span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-900">{formatMW(solarPeak)}</p>
            <p className="text-xs text-slate-400">{solarPct}%</p>
          </div>
          <div className="rounded-xl bg-sky-50 p-3">
            <div className="flex items-center gap-1.5 text-sky-600">
              <Wind size={14} />
              <span className="text-xs font-medium">Wind</span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-900">{formatMW(windPeak)}</p>
            <p className="text-xs text-slate-400">{windPct}%</p>
          </div>
        </div>
      )}
    </Card>
  )
}