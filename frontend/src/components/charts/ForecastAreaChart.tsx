import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { HourlyForecast } from '@/lib/types'
import { CHART_COLORS } from '@/lib/constants'
import { formatHourLabel } from '@/lib/utils'

interface ForecastAreaChartProps {
  data: HourlyForecast[]
  exportLimitMW?: number
  color?: string
  height?: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-slate-700">{formatHourLabel(label)}</p>
      <p className="text-slate-500">Expected: {point.expectedMW} MW</p>
      <p className="text-slate-400">
        Range: {point.p10MW}–{point.p90MW} MW
      </p>
    </div>
  )
}

export function ForecastAreaChart({ data, exportLimitMW, color = CHART_COLORS.solar, height = 320 }: ForecastAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="uncertaintyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.uncertainty} stopOpacity={0.6} />
            <stop offset="95%" stopColor={CHART_COLORS.uncertainty} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="expectedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.5} />
            <stop offset="95%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
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
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="p90MW" stroke="none" fill="url(#uncertaintyFill)" name="Upper bound" />
        <Area type="monotone" dataKey="p10MW" stroke="none" fill="#ffffff" name="Lower bound" />
        <Area
          type="monotone"
          dataKey="expectedMW"
          stroke={color}
          strokeWidth={2}
          fill="url(#expectedFill)"
          name="Expected MW"
        />
        {exportLimitMW && (
          <ReferenceLine
            y={exportLimitMW}
            stroke={CHART_COLORS.exportLimit}
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{ value: 'Export limit', position: 'insideTopRight', fontSize: 10, fill: CHART_COLORS.exportLimit }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}