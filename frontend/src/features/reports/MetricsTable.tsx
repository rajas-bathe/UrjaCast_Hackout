import React from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { PlaceholderValue } from '@/components/common/PlaceholderValue'
import type { MetricsResponse } from '@/lib/types'

interface MetricsTableProps {
  metrics: MetricsResponse | undefined
}

function cell(value: number | null) {
  return value === null ? <PlaceholderValue /> : <span className="font-semibold text-slate-900">{value}</span>
}

export function MetricsTable({ metrics }: MetricsTableProps) {
  if (!metrics) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
      </CardHeader>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400">
            <th className="pb-2">Lead Time</th>
            <th className="pb-2">MAE</th>
            <th className="pb-2">RMSE</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-slate-100">
            <td className="py-2 text-slate-600">24h</td>
            <td className="py-2">{cell(metrics.byLeadTime.h24.mae)}</td>
            <td className="py-2">{cell(metrics.byLeadTime.h24.rmse)}</td>
          </tr>
          <tr className="border-t border-slate-100">
            <td className="py-2 text-slate-600">48h</td>
            <td className="py-2">{cell(metrics.byLeadTime.h48.mae)}</td>
            <td className="py-2">{cell(metrics.byLeadTime.h48.rmse)}</td>
          </tr>
          <tr className="border-t border-slate-100">
            <td className="py-2 text-slate-600">72h</td>
            <td className="py-2">{cell(metrics.byLeadTime.h72.mae)}</td>
            <td className="py-2">{cell(metrics.byLeadTime.h72.rmse)}</td>
          </tr>
          <tr className="border-t border-slate-200">
            <td className="py-2 font-medium text-slate-700">Normalized MAE</td>
            <td className="py-2" colSpan={2}>
              {cell(metrics.normalizedMae)}
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  )
}