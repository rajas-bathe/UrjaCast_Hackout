import React from 'react'
import { Activity } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { DecisionResponse } from '@/lib/types'

interface GridStatusCardProps {
  decision: DecisionResponse | null
}

const statusConfig = {
  normal: { label: 'Normal', variant: 'success' as const },
  surplus: { label: 'Surplus', variant: 'warning' as const },
  shortfall: { label: 'Shortfall', variant: 'danger' as const },
}

export function GridStatusCard({ decision }: GridStatusCardProps) {
  const status = decision?.status || 'normal'
  const config = statusConfig[status]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grid Status</CardTitle>
        <Activity size={16} className="text-slate-300" />
      </CardHeader>
      <div className="flex items-center gap-3">
        <Badge variant={config.variant} className="text-sm px-3 py-1">
          {config.label}
        </Badge>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        {decision
          ? `${decision.recommendations.length} recommended action window(s) in the next 72h.`
          : 'Run a forecast and decision pass to see live grid status.'}
      </p>
    </Card>
  )
}