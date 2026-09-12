import React from 'react'
import { Battery, ArrowLeftRight, BatteryCharging, PowerOff, Scissors, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { WhyAccordion } from './WhyAccordion'
import { formatHourLabel } from '@/lib/utils'
import type { Recommendation, RecommendationAction } from '@/lib/types'

interface RecommendedActionsListProps {
  recommendations: Recommendation[]
}

const actionConfig: Record<RecommendationAction, { label: string; icon: React.ReactNode }> = {
  'charge-storage': { label: 'Charge Storage', icon: <BatteryCharging size={16} className="text-amber-600" /> },
  'shift-load': { label: 'Shift Flexible Load', icon: <ArrowLeftRight size={16} className="text-amber-600" /> },
  'prepare-discharge': { label: 'Prepare Battery Discharge', icon: <Battery size={16} className="text-rose-600" /> },
  'activate-backup': { label: 'Activate Backup', icon: <PowerOff size={16} className="text-rose-600" /> },
  curtail: { label: 'Curtail if Storage Full', icon: <Scissors size={16} className="text-rose-600" /> },
  'normal-operation': { label: 'Normal Operation', icon: <CheckCircle2 size={16} className="text-emerald-600" /> },
}

export function RecommendedActionsList({ recommendations }: RecommendedActionsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Actions</CardTitle>
      </CardHeader>
      {recommendations.length === 0 ? (
        <EmptyState title="No actions needed" description="Forecast generation is within the configured operating band." />
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, i) => {
            const c = actionConfig[rec.action]
            return (
              <div key={i} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {c.icon}
                    <p className="text-sm font-medium text-slate-800">{c.label}</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {formatHourLabel(rec.windowStart)}–{formatHourLabel(rec.windowEnd)}
                  </p>
                </div>
                <div className="mt-2">
                  <WhyAccordion recommendation={rec} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}