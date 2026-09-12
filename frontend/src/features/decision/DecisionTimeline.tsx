import React, { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { statusDotColor, formatHourLabel } from '@/lib/utils'
import type { DecisionTimelinePoint } from '@/lib/types'

interface DecisionTimelineProps {
  timeline: DecisionTimelinePoint[]
}

export function DecisionTimeline({ timeline }: DecisionTimelineProps) {
  const [hovered, setHovered] = useState<DecisionTimelinePoint | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Decision Timeline (72h)</CardTitle>
      </CardHeader>
      {timeline.length === 0 ? (
        <p className="text-xs text-slate-400">No timeline data yet.</p>
      ) : (
        <>
          <div className="flex h-8 w-full overflow-hidden rounded-lg">
            {timeline.map((point, i) => (
              <div
                key={i}
                className={statusDotColor(point.status)}
                style={{ width: `${100 / timeline.length}%` }}
                onMouseEnter={() => setHovered(point)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {hovered
              ? `${formatHourLabel(hovered.time)} · ${hovered.status}`
              : 'Hover over the timeline to inspect status by hour.'}
          </p>
        </>
      )}
    </Card>
  )
}