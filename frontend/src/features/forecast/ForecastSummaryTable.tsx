import React from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatMW, formatMWh } from '@/lib/utils'
import type { ForecastSummary } from '@/lib/types'

interface ForecastSummaryTableProps {
  summary: ForecastSummary
}

export function ForecastSummaryTable({ summary }: ForecastSummaryTableProps) {
  const rows = [
    { label: 'Peak Generation', value: formatMW(summary.peakMW) },
    { label: 'Average Generation', value: formatMW(summary.avgMW) },
    { label: 'Total (24h)', value: formatMWh(summary.total24hMWh) },
    { label: 'Total (72h)', value: formatMWh(summary.total72hMWh) },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forecast Summary</CardTitle>
      </CardHeader>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-slate-100 last:border-0">
              <td className="py-2 text-slate-500">{row.label}</td>
              <td className="py-2 text-right font-semibold text-slate-900">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}