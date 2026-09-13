import React from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatHourLabel } from '@/lib/utils'
import type { HourlyForecast } from '@/lib/types'

interface HourlyDataTableProps {
  data: HourlyForecast[]
  /**
   * Explicit weather column label. If omitted, auto-derived from data.
   */
  weatherLabel?: string
  /**
   * Which weather field to show. Defaults to auto-detect:
   * if any hour has wind_speed > 0 → "wind", else "ghi".
   */
  weatherKind?: 'ghi' | 'wind' | 'auto'
}

const statusVariant = {
  normal: 'success' as const,
  surplus: 'warning' as const,
  shortfall: 'danger' as const,
}

export function HourlyDataTable({
  data,
  weatherLabel,
  weatherKind = 'auto',
}: HourlyDataTableProps) {
  // ── Resolve which weather field to display ──────────────────────
  const resolvedKind: 'ghi' | 'wind' =
    weatherKind === 'auto'
      ? data.some((r) => (r.wind_speed ?? 0) > 0)
        ? 'wind'
        : 'ghi'
      : weatherKind

  const resolvedLabel =
    weatherLabel ??
    (resolvedKind === 'wind' ? 'Wind Speed (m/s)' : 'GHI (W/m²)')

  // ── Per-row weather render ──────────────────────────────────────
  const renderWeather = (row: HourlyForecast): string => {
    if (resolvedKind === 'wind') {
      const v = row.wind_speed
      return v != null ? `${v.toFixed(2)} m/s` : '—'
    }
    const v = row.ghi
    return v != null ? `${v.toFixed(0)} W/m²` : '—'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Data</CardTitle>
      </CardHeader>
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white">
            <tr className="text-left text-slate-400">
              <th className="py-2">Time</th>
              <th className="py-2">{resolvedLabel}</th>
              <th className="py-2">Predicted MW</th>
              <th className="py-2">Uncertainty</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.time} className="border-t border-slate-100">
                <td className="py-2 text-slate-600">
                  {formatHourLabel(row.time)}
                </td>
                <td className="py-2 text-slate-500 tabular-nums">
                  {renderWeather(row)}
                </td>
                <td className="py-2 font-medium text-slate-900 tabular-nums">
                  {row.expectedMW.toFixed(3)}
                </td>
                <td className="py-2 text-slate-400 tabular-nums">
                  {row.p10MW.toFixed(2)}–{row.p90MW.toFixed(2)}
                </td>
                <td className="py-2">
                  <Badge variant={statusVariant[row.status]}>
                    {row.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}