import React from 'react'
import { Sun, Wind, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'solar' | 'wind' | 'combined'

interface SolarWindToggleProps {
  value: Mode
  onChange: (mode: Mode) => void
  className?: string
}

const options: { value: Mode; label: string; icon: React.ReactNode }[] = [
  { value: 'solar', label: 'Solar', icon: <Sun size={14} /> },
  { value: 'wind', label: 'Wind', icon: <Wind size={14} /> },
  { value: 'combined', label: 'Combined', icon: <Layers size={14} /> },
]

export function SolarWindToggle({ value, onChange, className }: SolarWindToggleProps) {
  return (
    <div className={cn('inline-flex items-center rounded-xl bg-slate-100 p-1', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            value === opt.value ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )
}