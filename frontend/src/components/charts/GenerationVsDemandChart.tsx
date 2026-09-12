import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { HistoricalPerformancePoint } from '@/lib/types'
import { CHART_COLORS } from '@/lib/constants'
import { formatHourLabel } from '@/lib/utils'

interface GenerationVsDemandChartProps {
  data: HistoricalPerformancePoint[]
  height?: number
}

export function GenerationVsDemandChart({ data, height = 280 }: GenerationVsDemandChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="time"
          tickFormatter={formatHourLabel}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
          minTickGap={40}
        />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
        <Tooltip labelFormatter={formatHourLabel} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="forecastMW" stroke={CHART_COLORS.solar} strokeWidth={2} dot={false} name="Forecast" />
        <Line type="monotone" dataKey="actualMW" stroke={CHART_COLORS.demand} strokeWidth={2} dot={false} name="Actual" />
      </LineChart>
    </ResponsiveContainer>
  )
}