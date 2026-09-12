import React from 'react'
import { Accordion } from '@/components/ui/Accordion'
import type { Recommendation } from '@/lib/types'

interface WhyAccordionProps {
  recommendation: Recommendation
}

export function WhyAccordion({ recommendation }: WhyAccordionProps) {
  const { numbers, status } = recommendation
  return (
    <Accordion title="Why?">
      <div className="space-y-1.5 text-xs">
        <p>
          Predicted generation: <span className="font-semibold text-slate-900">{numbers.forecastMW} MW</span>
        </p>
        <p>
          {status === 'surplus' ? 'Export limit' : 'Load requirement'}:{' '}
          <span className="font-semibold text-slate-900">{numbers.thresholdMW} MW</span>
        </p>
        <p>
          Delta: <span className="font-semibold text-slate-900">{numbers.deltaMW} MW</span>
        </p>
        <p className="text-slate-500">Rule triggered: {recommendation.reason}</p>
      </div>
    </Accordion>
  )
}