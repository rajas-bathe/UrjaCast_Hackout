import type { AssetParamsSolar, AssetParamsWind } from './types'

export const DEFAULT_SOLAR_PARAMS: AssetParamsSolar = {
  type: 'solar',
  dcCapacityMW: 50,
  inverterCapacityMW: 45,
  tiltDeg: 20,
  azimuthDeg: 180,
  panelEfficiencyPct: 20.5,
  tempCoefficient: -0.35,
  systemLossesPct: 8,
  hasTracker: false,
}

export const DEFAULT_WIND_PARAMS: AssetParamsWind = {
  type: 'wind',
  hubHeightM: 100,
  rotorDiameterM: 120,
  ratedPowerMW: 2.5,
  numTurbines: 12,
  cutInSpeedMs: 3,
  ratedSpeedMs: 12,
  cutOutSpeedMs: 25,
}

export const CHART_COLORS = {
  solar: '#fbbf24',
  wind: '#38bdf8',
  demand: '#94a3b8',
  uncertainty: '#a7f3d0',
  exportLimit: '#e11d48',
}

export const STATUS_COLORS = {
  normal: '#10b981',
  surplus: '#f59e0b',
  shortfall: '#f43f5e',
}

export const GUJARAT_CENTER: [number, number] = [22.6, 71.6]
export const GUJARAT_DEFAULT_ZOOM = 7

export const SIDEBAR_WIDTH = 240

export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Map View', path: '/map', icon: 'Map' },
  { label: 'Forecast', path: '/forecast', icon: 'TrendingUp' },
  { label: 'Decision Panel', path: '/decision', icon: 'Zap' },
  { label: 'Reports', path: '/reports', icon: 'FileBarChart' },
  { label: 'Asset Config', path: '/asset-config', icon: 'Settings2' },
] as const