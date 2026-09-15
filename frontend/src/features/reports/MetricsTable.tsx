import React from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { PlaceholderValue } from '@/components/common/PlaceholderValue'
import type { MetricsResponse } from '@/lib/types'

interface MetricsTableProps {
  metrics?: MetricsResponse | null
  isLoading?: boolean
}

export function MetricsTable({ metrics, isLoading }: MetricsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <p className="text-sm text-slate-400">Loading…</p>
      </Card>
    )
  }

  const hasData =
    metrics?.validationStatus === 'complete' && metrics.mae != null

  const pick = (
    row: { mae: number | null; rmse: number | null } | undefined,
    key: 'mae' | 'rmse'
  ): number | null => row?.[key] ?? metrics?.[key] ?? null

  const rows = [
    { label: '24h', data: metrics?.byLeadTime?.h24 },
    { label: '48h', data: metrics?.byLeadTime?.h48 },
    { label: '72h', data: metrics?.byLeadTime?.h72 },
  ]

  const fmt = (v: number | null) => (v == null ? null : `${v.toFixed(2)} kW`)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
      </CardHeader>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="py-2 font-medium">Lead Time</th>
            <th className="py-2 font-medium">MAE</th>
            <th className="py-2 font-medium">RMSE</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const mae = pick(r.data, 'mae')
            const rmse = pick(r.data, 'rmse')
            return (
              <tr key={r.label} className="border-b border-slate-50">
                <td className="py-3 font-medium text-slate-700">{r.label}</td>
                <td className="py-3 text-slate-900">
                  {hasData ? fmt(mae) : <PlaceholderValue />}
                </td>
                <td className="py-3 text-slate-900">
                  {hasData ? fmt(rmse) : <PlaceholderValue />}
                </td>
              </tr>
            )
          })}
          <tr>
            <td className="py-3 font-medium text-slate-700">Normalized MAE</td>
            <td colSpan={2} className="py-3 text-slate-900">
              {hasData && metrics?.normalizedMae != null
                ? `${(metrics.normalizedMae * 100).toFixed(1)}%`
                : <PlaceholderValue />}
            </td>
          </tr>
        </tbody>
      </table>

      {hasData && metrics?.note && (
        <p className="mt-4 text-xs text-slate-500">{metrics.note}</p>
      )}
    </Card>
  )
}