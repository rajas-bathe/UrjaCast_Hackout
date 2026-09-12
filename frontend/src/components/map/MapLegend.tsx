import React from 'react'

const items = [
  { label: 'State', color: '#0f172a' },
  { label: 'District', color: '#64748b' },
  { label: 'Block', color: '#059669' },
  { label: 'Panchayat', color: '#34d399' },
]

export function MapLegend() {
  return (
    <div className="absolute bottom-4 right-4 z-[1000] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Boundaries</p>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}