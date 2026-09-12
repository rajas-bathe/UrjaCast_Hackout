import React from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatHourLabel } from '@/lib/utils'
import type { HourlyForecast } from '@/lib/types'

interface HourlyDataTableProps {
  data: HourlyForecast[]
  weatherLabel?: string
}

const statusVariant = {
  normal: 'success' as const,
  surplus: 'warning' as const,
  shortfall: 'danger' as const,
}

export function HourlyDataTable({ data, weatherLabel = 'GHI / Wind' }: HourlyDataTableProps) {
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
              <th className="py-2">{weatherLabel}</th>
              <th className="py-2">Predicted MW</th>
              <th className="py-2">Uncertainty</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.time} className="border-t border-slate-100">
                <td className="py-2 text-slate-600">{formatHourLabel(row.time)}</td>
                <td className="py-2 text-slate-500">—</td>
                <td className="py-2 font-medium text-slate-900">{row.expectedMW}</td>
                <td className="py-2 text-slate-400">
                  {row.p10MW}–{row.p90MW}
                </td>
                <td className="py-2">
                  <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}