import { Accordion } from '@/components/ui/Accordion'
import type { Recommendation } from '@/lib/types'

interface WhyAccordionProps {
  recommendation: Recommendation
}

const CAUSE_LABEL: Record<string, string> = {
  weather: 'Weather-driven',
  demand: 'Demand-driven',
  grid: 'Grid-driven',
  equipment: 'Equipment-driven',
}

export function WhyAccordion({ recommendation }: WhyAccordionProps) {
  const { numbers, status, reason, cause, factors } = recommendation

  return (
    <Accordion title="Why?">
      <div className="space-y-3 text-xs">
        {cause && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            {CAUSE_LABEL[cause] ?? cause}
          </div>
        )}

        <div className="space-y-1.5">
          <p>
            Predicted generation:{' '}
            <span className="font-semibold text-slate-900">
              {numbers.forecastMW} MW
            </span>
          </p>
          <p>
            {status === 'surplus' ? 'Export limit' : 'Load requirement'}:{' '}
            <span className="font-semibold text-slate-900">
              {numbers.thresholdMW} MW
            </span>
          </p>
          <p>
            Delta:{' '}
            <span className="font-semibold text-slate-900">
              {numbers.deltaMW} MW
            </span>
          </p>
        </div>

        {factors && factors.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Contributing factors
            </p>
            <ul className="space-y-1.5">
              {factors.map((f, i) => (
                <li key={i} className="flex gap-2 text-slate-600">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-slate-100 pt-3">
          <p className="text-slate-500">
            <span className="font-medium text-slate-700">Rule triggered: </span>
            {reason}
          </p>
        </div>
      </div>
    </Accordion>
  )
}