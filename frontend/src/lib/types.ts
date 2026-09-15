// ─────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────
// Asset Parameters
// ─────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────
// GIS
// ─────────────────────────────────────────────────────────────────────
export interface GISHierarchy {
  state: string
  district: string
  block: string
  panchayat: string
  resolutionLevel?: string
  terrainClass?: string
  gridFallback?: boolean
}

// ─────────────────────────────────────────────────────────────────────
// Sites
// ─────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────
// Provenance
// ─────────────────────────────────────────────────────────────────────
export type Provenance =
  | 'measured'
  | 'model-derived'
  | 'static-geospatial'
  | 'simulated'

// ─────────────────────────────────────────────────────────────────────
// Weather
// ─────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────
// Forecast
// ─────────────────────────────────────────────────────────────────────
export type ForecastModelTag =
  | 'pvlib'
  | 'xgboost'
  | 'power-curve'
  | 'ml-correction'
  | 'log-law'
  | 'density-corrected'
  | 'fallback'

export interface HourlyForecast {
  time: string
  expectedMW: number
  p10MW: number
  p90MW: number
  status: 'normal' | 'surplus' | 'shortfall'
  provenance: ForecastModelTag[]
  ghi?: number | null
  wind_speed?: number | null
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
  latitude?: number
  longitude?: number
  gis?: GISHierarchy
  assetParams: AssetParams
}

// ─────────────────────────────────────────────────────────────────────
// Decision
// ─────────────────────────────────────────────────────────────────────
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
  assetType?: 'solar' | 'wind'
}

export type RecommendationAction =
  | 'charge-storage'
  | 'shift-load'
  | 'sell-to-grid'
  | 'pre-cool'
  | 'hydrogen'
  | 'notify-grid'
  | 'curtail'
  | 'prepare-discharge'
  | 'defer-load'
  | 'activate-backup'
  | 'buy-spot'
  | 'shed-load'
  | 'normal-operation'

export type RecommendationCause =
  | 'weather'
  | 'demand'
  | 'grid'
  | 'equipment'

export interface Recommendation {
  windowStart: string
  windowEnd: string
  status: 'surplus' | 'shortfall' | 'normal'
  action: RecommendationAction
  reason: string
  cause?: RecommendationCause
  factors?: string[]
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

// ─────────────────────────────────────────────────────────────────────
// Metrics
// ─────────────────────────────────────────────────────────────────────
export interface LeadTimeMetric {
  mae: number | null
  rmse: number | null
}

export interface MetricsResponse {
  mae: number | null
  rmse: number | null
  normalizedMae: number | null
  r2?: number | null
  baseline?: {
    mae: number | null
    rmse: number | null
    r2?: number | null
  }
  byLeadTime: {
    h24: LeadTimeMetric
    h48: LeadTimeMetric
    h72: LeadTimeMetric
  }
  validationStatus: 'pending' | 'complete'
  note: string
  trainedAt?: string | null
}

// ─────────────────────────────────────────────────────────────────────
// Alerts
// ─────────────────────────────────────────────────────────────────────
export interface Alert {
  id: string
  siteId: string
  type: 'surplus' | 'shortfall'
  message: string
  time: string
}

// ─────────────────────────────────────────────────────────────────────
// Historical performance
// ─────────────────────────────────────────────────────────────────────
export interface HistoricalPerformancePoint {
  time: string
  actualMW: number
  forecastMW: number
}

// ─────────────────────────────────────────────────────────────────────
// API errors
// ─────────────────────────────────────────────────────────────────────
export interface ApiErrorShape {
  message: string
  status?: number
}