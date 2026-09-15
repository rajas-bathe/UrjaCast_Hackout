import React from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatMW, formatMWh } from '@/lib/utils'
import type { ForecastSummary } from '@/lib/types'

interface ForecastSummaryTableProps {
  summary: ForecastSummary
}

interface Row {
  label: string
  value: string
  sub?: string
}

export function ForecastSummaryTable({ summary }: ForecastSummaryTableProps) {
  const { peakMW, avgMW, total24hMWh, total72hMWh } = summary

  // Derive both averages from totals so labels are always accurate.
  // Falls back to backend avgMW if totals are missing.
  const avg24h = total24hMWh ? total24hMWh / 24 : undefined
  const avg72h = total72hMWh ? total72hMWh / 72 : avgMW

  const rows: Row[] = [
    {
      label: 'Peak Generation',
      value: formatMW(peakMW),
    },
    {
      label: 'Avg. Generation (24h)',
      value: avg24h != null ? formatMW(avg24h) : '—',
      sub: avg24h != null ? `across ${24} hours` : undefined,
    },
    {
      label: 'Total Generation (24h)',
      value: formatMWh(total24hMWh),
    },
    {
      label: 'Avg. Generation (72h)',
      value: avg72h != null ? formatMW(avg72h) : '—',
      sub: avg72h != null ? `across ${72} hours` : undefined,
    },
    {
      label: 'Total Generation (72h)',
      value: formatMWh(total72hMWh),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forecast Summary</CardTitle>
      </CardHeader>
      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700">{row.label}</p>
              {row.sub && (
                <p className="text-[11px] text-slate-400">{row.sub}</p>
              )}
            </div>
            <p className="text-base font-semibold text-slate-900 tabular-nums">
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}