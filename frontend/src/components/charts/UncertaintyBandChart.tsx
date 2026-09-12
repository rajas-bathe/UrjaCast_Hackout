import React from 'react'
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { HourlyForecast } from '@/lib/types'
import { CHART_COLORS } from '@/lib/constants'
import { formatHourLabel } from '@/lib/utils'

interface UncertaintyBandChartProps {
  data: HourlyForecast[]
  height?: number
}

export function UncertaintyBandChart({ data, height = 280 }: UncertaintyBandChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
        <Area
          type="monotone"
          dataKey="p90MW"
          stroke="none"
          fill={CHART_COLORS.uncertainty}
          fillOpacity={0.4}
          name="P90"
        />
        <Area type="monotone" dataKey="p10MW" stroke="none" fill="#ffffff" fillOpacity={1} name="P10" />
        <Line type="monotone" dataKey="expectedMW" stroke={CHART_COLORS.solar} strokeWidth={2} dot={false} name="Expected" />
      </ComposedChart>
    </ResponsiveContainer>
  )
}