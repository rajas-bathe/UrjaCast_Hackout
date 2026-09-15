import React from 'react'
import {
  BatteryCharging,
  BatteryLow,
  Factory,
  ShoppingCart,
  Droplets,
  Bell,
  Scissors,
  Clock,
  Power,
  TrendingDown,
  TrendingUp,
  Zap,
  Layers,
  Snowflake,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { WhyAccordion } from './WhyAccordion'
import { formatHourLabel } from '@/lib/utils'
import type { Recommendation, RecommendationAction } from '@/lib/types'

interface RecommendedActionsListProps {
  recommendations: Recommendation[]
}

interface ActionMeta {
  icon: React.ComponentType<{ className?: string; size?: number }>
  label: string
  tone: 'surplus' | 'shortfall' | 'neutral'
}

const ACTION_META: Record<RecommendationAction, ActionMeta> = {
  // Surplus ladder
  'charge-storage':   { icon: BatteryCharging, label: 'Charge Storage',       tone: 'surplus' },
  'shift-load':       { icon: Factory,         label: 'Shift Flexible Load',  tone: 'surplus' },
  'sell-to-grid':     { icon: TrendingUp,      label: 'Sell to Grid',         tone: 'surplus' },
  'pre-cool':         { icon: Snowflake,       label: 'Pre-cool Load',        tone: 'surplus' },
  'hydrogen':         { icon: Droplets,        label: 'Route to Electrolyzer',tone: 'surplus' },
  'notify-grid':      { icon: Bell,            label: 'Notify Grid Operator', tone: 'surplus' },
  'curtail':          { icon: Scissors,        label: 'Curtail Generation',   tone: 'surplus' },
  // Shortfall ladder
  'prepare-discharge':{ icon: BatteryLow,      label: 'Prepare Battery Discharge', tone: 'shortfall' },
  'defer-load':       { icon: Clock,           label: 'Defer Load',           tone: 'shortfall' },
  'activate-backup':  { icon: Power,           label: 'Activate Backup',      tone: 'shortfall' },
  'buy-spot':         { icon: ShoppingCart,    label: 'Buy from Spot Market', tone: 'shortfall' },
  'shed-load':        { icon: TrendingDown,    label: 'Shed Flexible Load',   tone: 'shortfall' },
  // Neutral
  'normal-operation': { icon: Zap,             label: 'Normal Operation',     tone: 'neutral' },
}

const FALLBACK_META: ActionMeta = {
  icon: Layers,
  label: 'Action',
  tone: 'neutral',
}

export function RecommendedActionsList({ recommendations }: RecommendedActionsListProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <EmptyState
          title="No actions required"
          description="Run a forecast or adjust thresholds to see recommendations."
        />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Actions</CardTitle>
      </CardHeader>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => {
          const meta = ACTION_META[rec.action] ?? FALLBACK_META
          const Icon = meta.icon

          const iconBg =
            meta.tone === 'surplus'
              ? 'bg-amber-50 text-amber-600'
              : meta.tone === 'shortfall'
              ? 'bg-rose-50 text-rose-600'
              : 'bg-slate-50 text-slate-600'

          const startLabel = formatHourLabel(rec.windowStart)
          const endLabel = formatHourLabel(rec.windowEnd)

          return (
            <div
              key={`${rec.windowStart}-${idx}`}
              className="rounded-2xl border border-slate-100 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {meta.label}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {rec.reason}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right text-xs text-slate-500">
                  {startLabel} – {endLabel}
                </div>
              </div>

              <div className="mt-3">
                <WhyAccordion recommendation={rec} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}