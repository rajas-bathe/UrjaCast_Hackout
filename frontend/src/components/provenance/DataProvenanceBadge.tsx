import React from 'react'
import { Radio, Cpu, MapPinned, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Provenance } from '@/lib/types'

const config: Record<Provenance, { label: string; icon: React.ReactNode; className: string }> = {
  measured: {
    label: 'Measured',
    icon: <Radio size={11} />,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  'model-derived': {
    label: 'Model-derived',
    icon: <Cpu size={11} />,
    className: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  'static-geospatial': {
    label: 'Static geospatial',
    icon: <MapPinned size={11} />,
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  simulated: {
    label: 'Simulated',
    icon: <FlaskConical size={11} />,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
}

interface DataProvenanceBadgeProps {
  type: Provenance
  label?: string
  className?: string
}

export function DataProvenanceBadge({ type, label, className }: DataProvenanceBadgeProps) {
  const c = config[type]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
        c.className,
        className,
      )}
    >
      {c.icon}
      {label || c.label}
    </span>
  )
}