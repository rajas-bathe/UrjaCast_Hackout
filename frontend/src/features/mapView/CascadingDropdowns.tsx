import React, { useMemo } from 'react'
import { Select } from '@/components/ui/Select'
import type { GISHierarchy } from '@/lib/types'

interface CascadingDropdownsProps {
  layers: {
    districts: GeoJSON.FeatureCollection | null
    blocks: GeoJSON.FeatureCollection | null
    panchayats: GeoJSON.FeatureCollection | null
  }
  gis: GISHierarchy | null
  onChange: (gis: GISHierarchy) => void
}

/** Property key variants — tries each until one returns a value. */
const KEYS = {
  district: ['dtname', 'DTNAME', 'district', 'DISTRICT', 'D_Pan_Name'],
  block: ['block_name', 'blkname', 'BLKNAME', 'block', 'BLOCK', 'B_Pan_Name'],
  panchayat: [
    'GPNAME', 'gpname', 'GP_NAME', 'gp_name',
    'panchayat', 'PANCHAYAT', 'village', 'VILLAGE', 'name', 'NAME',
  ],
}

function uniqueNames(fc: GeoJSON.FeatureCollection | null, keys: string[]): string[] {
  if (!fc || !fc.features) return []
  const names = new Set<string>()
  for (const f of fc.features) {
    const props = f.properties || {}
    for (const key of keys) {
      const val = props[key]
      if (val != null && String(val).trim() !== '') {
        names.add(String(val))
        break
      }
    }
  }
  return Array.from(names).sort()
}

export function CascadingDropdowns({ layers, gis, onChange }: CascadingDropdownsProps) {
  const districtOptions = useMemo(
    () => uniqueNames(layers.districts, KEYS.district),
    [layers.districts],
  )
  const blockOptions = useMemo(
    () => uniqueNames(layers.blocks, KEYS.block),
    [layers.blocks],
  )
  const panchayatOptions = useMemo(
    () => uniqueNames(layers.panchayats, KEYS.panchayat),
    [layers.panchayats],
  )

  const current: GISHierarchy =
    gis || { state: 'Gujarat', district: '', block: '', panchayat: '' }

  const isGridFallback = current.resolutionLevel === 'grid'

  // In grid-fallback mode, the panchayat value is a grid_id (e.g. "GJ-23.80-70.50")
  // that won't be in the real panchayat layer's options — inject it as its own
  // option so the <select> can display it, labeled with the "5km grid fallback" badge text.
  const panchayatSelectOptions = useMemo(() => {
    if (isGridFallback && current.panchayat) {
      return [{ label: `${current.panchayat} (5km grid fallback)`, value: current.panchayat }]
    }
    return panchayatOptions.map((p) => ({ label: p, value: p }))
  }, [isGridFallback, current.panchayat, panchayatOptions])

  function update(field: keyof GISHierarchy, value: string) {
    onChange({ ...current, [field]: value })
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Select
        label="State"
        options={[{ label: 'Gujarat', value: 'Gujarat' }]}
        value="Gujarat"
        disabled
      />

      <Select
        label="District"
        placeholder={`Select district (${districtOptions.length})`}
        options={districtOptions.map((d) => ({ label: d, value: d }))}
        value={current.district}
        onChange={(e) => update('district', e.target.value)}
      />

      <Select
        label="Block"
        placeholder={`Select block (${blockOptions.length})`}
        options={blockOptions.map((b) => ({ label: b, value: b }))}
        value={current.block}
        onChange={(e) => update('block', e.target.value)}
      />

      <div>
        <Select
          label="Panchayat"
          placeholder={
            isGridFallback
              ? undefined
              : `Select panchayat (${panchayatOptions.length})`
          }
          options={panchayatSelectOptions}
          value={current.panchayat}
          onChange={(e) => update('panchayat', e.target.value)}
          disabled={isGridFallback}
        />
        {isGridFallback && (
          <p className="mt-1 text-[11px] text-amber-600">
            No Panchayat found in this block — using 5km grid fallback{' '}
            <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              grid
            </span>
          </p>
        )}
      </div>
    </div>
  )
}