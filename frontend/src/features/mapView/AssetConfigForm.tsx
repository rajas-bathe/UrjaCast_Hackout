import React from 'react'
import { Input } from '@/components/ui/Input'
import { DataProvenanceBadge } from '@/components/provenance/DataProvenanceBadge'
import { DEFAULT_SOLAR_PARAMS, DEFAULT_WIND_PARAMS } from '@/lib/constants'
import type { AssetParams, AssetParamsSolar, AssetParamsWind } from '@/lib/types'

interface AssetConfigFormProps {
  value: AssetParams
  onChange: (params: AssetParams) => void
}

export function AssetConfigForm({ value, onChange }: AssetConfigFormProps) {
  function setType(type: 'solar' | 'wind') {
    onChange(type === 'solar' ? DEFAULT_SOLAR_PARAMS : DEFAULT_WIND_PARAMS)
  }

  function updateSolar(field: keyof AssetParamsSolar, val: number | boolean) {
    if (value.type !== 'solar') return
    onChange({ ...value, [field]: val })
  }

  function updateWind(field: keyof AssetParamsWind, val: number) {
    if (value.type !== 'wind') return
    onChange({ ...value, [field]: val })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-600">Asset Type</label>
        <div className="flex gap-4">
          {(['solar', 'wind'] as const).map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="assetType"
                checked={value.type === t}
                onChange={() => setType(t)}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              {t === 'solar' ? 'Solar' : 'Wind'}
            </label>
          ))}
        </div>
      </div>

      {value.type === 'solar' ? (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="DC Capacity (MW)"
            type="number"
            value={value.dcCapacityMW}
            onChange={(e) => updateSolar('dcCapacityMW', Number(e.target.value))}
          />
          <Input
            label="Inverter Capacity (MW)"
            type="number"
            value={value.inverterCapacityMW}
            onChange={(e) => updateSolar('inverterCapacityMW', Number(e.target.value))}
          />
          <Input
            label="Tilt (°)"
            type="number"
            value={value.tiltDeg}
            onChange={(e) => updateSolar('tiltDeg', Number(e.target.value))}
          />
          <Input
            label="Azimuth (°)"
            type="number"
            value={value.azimuthDeg}
            onChange={(e) => updateSolar('azimuthDeg', Number(e.target.value))}
          />
          <Input
            label="Panel Efficiency (%)"
            type="number"
            value={value.panelEfficiencyPct}
            onChange={(e) => updateSolar('panelEfficiencyPct', Number(e.target.value))}
          />
          <Input
            label="Temp Coefficient (%/°C)"
            type="number"
            step="0.01"
            value={value.tempCoefficient}
            onChange={(e) => updateSolar('tempCoefficient', Number(e.target.value))}
          />
          <Input
            label="System Losses (%)"
            type="number"
            value={value.systemLossesPct}
            onChange={(e) => updateSolar('systemLossesPct', Number(e.target.value))}
          />
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={value.hasTracker}
              onChange={(e) => updateSolar('hasTracker', e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Tracker
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Hub Height (m)"
            type="number"
            value={value.hubHeightM}
            onChange={(e) => updateWind('hubHeightM', Number(e.target.value))}
          />
          <Input
            label="Rotor Diameter (m)"
            type="number"
            value={value.rotorDiameterM}
            onChange={(e) => updateWind('rotorDiameterM', Number(e.target.value))}
          />
          <Input
            label="Rated Power (MW)"
            type="number"
            value={value.ratedPowerMW}
            onChange={(e) => updateWind('ratedPowerMW', Number(e.target.value))}
          />
          <Input
            label="Number of Turbines"
            type="number"
            value={value.numTurbines}
            onChange={(e) => updateWind('numTurbines', Number(e.target.value))}
          />
          <Input
            label="Cut-in Speed (m/s)"
            type="number"
            value={value.cutInSpeedMs}
            onChange={(e) => updateWind('cutInSpeedMs', Number(e.target.value))}
          />
          <Input
            label="Rated Speed (m/s)"
            type="number"
            value={value.ratedSpeedMs}
            onChange={(e) => updateWind('ratedSpeedMs', Number(e.target.value))}
          />
          <Input
            label="Cut-out Speed (m/s)"
            type="number"
            value={value.cutOutSpeedMs}
            onChange={(e) => updateWind('cutOutSpeedMs', Number(e.target.value))}
          />
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
        <DataProvenanceBadge type="measured" />
        <p className="text-xs text-slate-500">Asset parameters you enter are tagged as measured for this forecast.</p>
      </div>
    </div>
  )
}