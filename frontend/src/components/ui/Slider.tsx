import React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
  className?: string
}

export function Slider({ label, value, min, max, step = 1, unit = '', onChange, className }: SliderProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        <span className="text-xs font-semibold text-emerald-700">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full bg-slate-200 accent-emerald-600 cursor-pointer"
        aria-label={label}
      />
    </div>
  )
}