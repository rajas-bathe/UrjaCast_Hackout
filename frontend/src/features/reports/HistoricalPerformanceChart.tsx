import React from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { GenerationVsDemandChart } from '@/components/charts/GenerationVsDemandChart'
import type { HistoricalPerformancePoint } from '@/lib/types'

interface HistoricalPerformanceChartProps {
  data: HistoricalPerformancePoint[] | undefined
}

export function HistoricalPerformanceChart({ data }: HistoricalPerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Performance</CardTitle>
      </CardHeader>
      {!data || data.length === 0 ? (
        <EmptyState title="No historical data yet" description="Actual vs forecast comparisons will appear here once available." />
      ) : (
        <GenerationVsDemandChart data={data} />
      )}
    </Card>
  )
}