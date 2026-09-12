export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  name: string
  email: string
  password: string
  team?: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  team: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface AssetParamsSolar {
  type: 'solar'
  dcCapacityMW: number
  inverterCapacityMW: number
  tiltDeg: number
  azimuthDeg: number
  panelEfficiencyPct: number
  tempCoefficient: number
  systemLossesPct: number
  hasTracker: boolean
}

export interface AssetParamsWind {
  type: 'wind'
  hubHeightM: number
  rotorDiameterM: number
  ratedPowerMW: number
  numTurbines: number
  cutInSpeedMs: number
  ratedSpeedMs: number
  cutOutSpeedMs: number
}

export type AssetParams = AssetParamsSolar | AssetParamsWind

// PATCHED: added optional resolutionLevel/terrainClass/gridFallback fields for 5km grid fallback support
export interface GISHierarchy {
  state: string
  district: string
  block: string
  panchayat: string
  resolutionLevel?: string
  terrainClass?: string
  gridFallback?: boolean
}

export interface Site {
  id: string
  name: string
  latitude: number
  longitude: number
  gis: GISHierarchy
  assetParams: AssetParams
  createdAt: string
}

export interface CreateSiteRequest {
  name: string
  latitude: number
  longitude: number
  gis: GISHierarchy
  assetParams: AssetParams
}

export type Provenance = 'measured' | 'model-derived' | 'static-geospatial' | 'simulated'

export interface HourlyWeather {
  time: string
  ghi: number
  dni: number
  dhi: number
  cloudCover: number
  tempC: number
  humidityPct: number
  windSpeedMs: number
  windDirectionDeg: number
  pressureHpa: number
  precipitationMm: number
}

export interface WeatherResponse {
  latitude: number
  longitude: number
  hours: HourlyWeather[]
  source: 'open-meteo'
  provenance: 'model-derived'
}

export interface CurrentWeather {
  tempC: number
  condition: string
  windSpeedMs: number
  humidityPct: number
  ghi: number
  provenance: 'model-derived'
}

export type ForecastModelTag = 'pvlib' | 'xgboost' | 'power-curve' | 'ml-correction'

export interface HourlyForecast {
  time: string
  expectedMW: number
  p10MW: number
  p90MW: number
  status: 'normal' | 'surplus' | 'shortfall'
  provenance: ForecastModelTag[]
}

export interface ForecastSummary {
  peakMW: number
  avgMW: number
  total24hMWh: number
  total72hMWh: number
}

export interface ForecastResponse {
  siteId: string
  generatedAt: string
  horizonHours: 72
  solar?: HourlyForecast[]
  wind?: HourlyForecast[]
  combined?: HourlyForecast[]
  summary: ForecastSummary
}

export interface ForecastRequest {
  siteId: string
  assetParams: AssetParams
}

export interface OperatingRequirement {
  exportLimitMW: number
  loadRequirementMW: number
}

export interface StorageConfig {
  availableMWh: number
  maxChargeMW: number
  maxDischargeMW: number
}

export interface FlexibleLoadConfig {
  shiftableMW: number
}

export interface BackupConfig {
  capacityMW: number
}

export interface DecisionRequest {
  siteId: string
  forecast: ForecastResponse
  operatingRequirement: OperatingRequirement
  storage: StorageConfig
  flexibleLoad: FlexibleLoadConfig
  backup: BackupConfig
}

export type RecommendationAction =
  | 'charge-storage'
  | 'shift-load'
  | 'prepare-discharge'
  | 'activate-backup'
  | 'curtail'
  | 'normal-operation'

export interface Recommendation {
  windowStart: string
  windowEnd: string
  status: 'surplus' | 'shortfall' | 'normal'
  action: RecommendationAction
  reason: string
  numbers: {
    forecastMW: number
    thresholdMW: number
    deltaMW: number
  }
}

export interface DecisionTimelinePoint {
  time: string
  status: 'normal' | 'surplus' | 'shortfall'
}

export interface DecisionResponse {
  status: 'normal' | 'surplus' | 'shortfall'
  recommendations: Recommendation[]
  timeline: DecisionTimelinePoint[]
}

export interface LeadTimeMetric {
  mae: number | null
  rmse: number | null
}

export interface MetricsResponse {
  mae: number | null
  rmse: number | null
  normalizedMae: number | null
  byLeadTime: {
    h24: LeadTimeMetric
    h48: LeadTimeMetric
    h72: LeadTimeMetric
  }
  validationStatus: 'pending' | 'complete'
  note: string
}

export interface Alert {
  id: string
  siteId: string
  type: 'surplus' | 'shortfall'
  message: string
  time: string
}

export interface HistoricalPerformancePoint {
  time: string
  actualMW: number
  forecastMW: number
}

export interface ApiErrorShape {
  message: string
  status?: number
}