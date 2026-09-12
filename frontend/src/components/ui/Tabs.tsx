import React from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  label: string
  value: string
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (value: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('inline-flex items-center rounded-xl bg-slate-100 p-1', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={active === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
            active === tab.value ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}