import type {
  Alert,
  CurrentWeather,
  ForecastResponse,
  HistoricalPerformancePoint,
  HourlyForecast,
  HourlyWeather,
  MetricsResponse,
  Site,
  WeatherResponse,
} from './types'

function hoursFromNow(count: number): string[] {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getTime() + i * 60 * 60 * 1000)
    return d.toISOString()
  })
}

function solarCurve(hourOfDay: number): number {
  if (hourOfDay < 6 || hourOfDay > 18) return 0
  const x = ((hourOfDay - 6) / 12) * Math.PI
  return Math.max(0, Math.sin(x))
}

export function generateMockWeather(lat: number, lon: number): WeatherResponse {
  const times = hoursFromNow(72)
  const hours: HourlyWeather[] = times.map((t) => {
    const hourOfDay = new Date(t).getHours()
    const ghi = Math.round(solarCurve(hourOfDay) * 900)
    return {
      time: t,
      ghi,
      dni: Math.round(ghi * 1.1),
      dhi: Math.round(ghi * 0.25),
      cloudCover: Math.round(10 + Math.random() * 40),
      tempC: Math.round(22 + solarCurve(hourOfDay) * 14 + Math.random() * 2),
      humidityPct: Math.round(35 + Math.random() * 25),
      windSpeedMs: Math.round((2 + Math.random() * 7) * 10) / 10,
      windDirectionDeg: Math.round(Math.random() * 360),
      pressureHpa: 1008 + Math.round(Math.random() * 6),
      precipitationMm: Math.random() > 0.9 ? Math.round(Math.random() * 4) : 0,
    }
  })
  return { latitude: lat, longitude: lon, hours, source: 'open-meteo', provenance: 'model-derived' }
}

export function generateMockCurrentWeather(): CurrentWeather {
  return {
    tempC: 32,
    condition: 'Sunny',
    windSpeedMs: 3.3,
    humidityPct: 48,
    ghi: 780,
    provenance: 'model-derived',
  }
}

function buildHourlyForecast(times: string[], peakMW: number, isWind: boolean): HourlyForecast[] {
  return times.map((t) => {
    const hourOfDay = new Date(t).getHours()
    const base = isWind
      ? peakMW * (0.3 + 0.5 * Math.abs(Math.sin(hourOfDay / 4)))
      : peakMW * solarCurve(hourOfDay)
    const expectedMW = Math.round(base * 10) / 10
    const spread = Math.max(1, expectedMW * 0.15)
    const status: HourlyForecast['status'] =
      expectedMW > peakMW * 0.85 ? 'surplus' : expectedMW < peakMW * 0.15 && expectedMW > 0 ? 'shortfall' : 'normal'
    return {
      time: t,
      expectedMW,
      p10MW: Math.max(0, Math.round((expectedMW - spread) * 10) / 10),
      p90MW: Math.round((expectedMW + spread) * 10) / 10,
      status,
      provenance: isWind ? ['power-curve'] : ['pvlib', 'xgboost'],
    }
  })
}

export function generateMockForecast(siteId: string, peakMW = 45, type: 'solar' | 'wind' = 'solar'): ForecastResponse {
  const times = hoursFromNow(72)
  const series = buildHourlyForecast(times, peakMW, type === 'wind')
  const first24 = series.slice(0, 24)
  const peak = Math.max(...series.map((s) => s.expectedMW))
  const avg = series.reduce((a, s) => a + s.expectedMW, 0) / series.length
  const total24 = first24.reduce((a, s) => a + s.expectedMW, 0)
  const total72 = series.reduce((a, s) => a + s.expectedMW, 0)

  return {
    siteId,
    generatedAt: new Date().toISOString(),
    horizonHours: 72,
    [type]: series,
    summary: {
      peakMW: Math.round(peak * 10) / 10,
      avgMW: Math.round(avg * 10) / 10,
      total24hMWh: Math.round(total24),
      total72hMWh: Math.round(total72),
    },
  } as ForecastResponse
}

export function generateMockSites(): Site[] {
  return [
    {
      id: 'site-dholka-50mw-solar',
      name: '50 MW Solar Farm — Dholka',
      latitude: 22.72,
      longitude: 72.47,
      gis: { state: 'Gujarat', district: 'Ahmedabad', block: 'Dholka', panchayat: 'Dholka' },
      assetParams: {
        type: 'solar',
        dcCapacityMW: 50,
        inverterCapacityMW: 45,
        tiltDeg: 20,
        azimuthDeg: 180,
        panelEfficiencyPct: 20.5,
        tempCoefficient: -0.35,
        systemLossesPct: 8,
        hasTracker: false,
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'site-kutch-30mw-wind',
      name: '30 MW Wind Farm — Kutch',
      latitude: 23.73,
      longitude: 69.86,
      gis: { state: 'Gujarat', district: 'Kutch', block: 'Bhachau', panchayat: 'Bhachau' },
      assetParams: {
        type: 'wind',
        hubHeightM: 100,
        rotorDiameterM: 120,
        ratedPowerMW: 2.5,
        numTurbines: 12,
        cutInSpeedMs: 3,
        ratedSpeedMs: 12,
        cutOutSpeedMs: 25,
      },
      createdAt: new Date().toISOString(),
    },
  ]
}

export function generateMockMetrics(): MetricsResponse {
  return {
    mae: null,
    rmse: null,
    normalizedMae: null,
    byLeadTime: {
      h24: { mae: null, rmse: null },
      h48: { mae: null, rmse: null },
      h72: { mae: null, rmse: null },
    },
    validationStatus: 'pending',
    note: 'TO BE FILLED AFTER FINAL MODEL VALIDATION',
  }
}

export function generateMockAlerts(): Alert[] {
  const now = Date.now()
  return [
    {
      id: 'alert-1',
      siteId: 'site-dholka-50mw-solar',
      type: 'surplus',
      message: 'Surplus expected 12:00–15:00 · +18.4 MWh above export limit',
      time: new Date(now - 1000 * 60 * 40).toISOString(),
    },
    {
      id: 'alert-2',
      siteId: 'site-dholka-50mw-solar',
      type: 'shortfall',
      message: 'Shortfall expected 19:00–21:00 · -9.2 MWh below load requirement',
      time: new Date(now - 1000 * 60 * 90).toISOString(),
    },
  ]
}

export function generateMockHistoricalPerformance(): HistoricalPerformancePoint[] {
  const times = hoursFromNow(24).map((t) => new Date(new Date(t).getTime() - 24 * 60 * 60 * 1000).toISOString())
  return times.map((t) => {
    const hourOfDay = new Date(t).getHours()
    const forecastMW = Math.round(solarCurve(hourOfDay) * 45 * 10) / 10
    const actualMW = Math.round(Math.max(0, forecastMW + (Math.random() - 0.5) * 6) * 10) / 10
    return { time: t, actualMW, forecastMW }
  })
}