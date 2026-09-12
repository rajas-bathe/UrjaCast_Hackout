import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import type { Site } from '@/lib/types'

interface ForecastHeaderProps {
  site: Site | null
}

export function ForecastHeader({ site }: ForecastHeaderProps) {
  const navigate = useNavigate()

  if (!site) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        No site selected. Go to Map View to choose a site.
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <MapPin size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{site.name}</p>
          <p className="text-xs text-slate-400">
            {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)} · {site.gis.panchayat}, {site.gis.district}
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate('/map')}
        className="text-xs font-medium text-emerald-700 hover:underline"
      >
        Change Site
      </button>
    </div>
  )
}