import React from 'react'
import { CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type { DecisionResponse } from '@/lib/types'

interface StatusIndicatorProps {
  decision: DecisionResponse | null
}

const config = {
  normal: {
    label: 'Normal',
    icon: <CheckCircle2 size={28} />,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  surplus: {
    label: 'Surplus Expected',
    icon: <TrendingUp size={28} />,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  shortfall: {
    label: 'Shortfall Expected',
    icon: <TrendingDown size={28} />,
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
}

export function StatusIndicator({ decision }: StatusIndicatorProps) {
  const status = decision?.status || 'normal'
  const c = config[status]

  return (
    <Card className={cn('border-2', c.className)}>
      <div className="flex items-center gap-4">
        {c.icon}
        <div>
          <p className="text-lg font-bold">{c.label}</p>
          <p className="text-xs opacity-80">Grid & Operational Status — next 72h</p>
        </div>
      </div>
    </Card>
  )
}