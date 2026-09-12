import React from 'react'
import { MapPinned } from 'lucide-react'
import { DataProvenanceBadge } from '@/components/provenance/DataProvenanceBadge'
import type { GISHierarchy } from '@/lib/types'

interface GISLookupPanelProps {
  latitude: number | null
  longitude: number | null
  gis: GISHierarchy | null
}

export function GISLookupPanel({ latitude, longitude, gis }: GISLookupPanelProps) {
  if (latitude === null || longitude === null) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-400">
        <MapPinned size={14} />
        Click on the map to select a site.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-emerald-700">Selected Location</p>
        <DataProvenanceBadge type="static-geospatial" />
      </div>
      <p className="mt-1 text-xs text-slate-600">
        Lat {latitude.toFixed(4)}, Lon {longitude.toFixed(4)}
      </p>
      {gis && (
        <p className="mt-1 text-xs text-slate-500">
          {gis.state} → {gis.district} → {gis.block} → {gis.panchayat}
        </p>
      )}
    </div>
  )
}