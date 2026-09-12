export const ENDPOINTS = {
  authLogin: '/api/auth/login',
  authSignup: '/api/auth/signup',
  authMe: '/api/auth/me',

  sites: '/api/sites',
  site: (id: string) => `/api/sites/${id}`,

  weather: '/api/weather',
  weatherCurrent: '/api/weather/current',

  forecast: '/api/forecast',
  decision: '/api/decision',

  metrics: '/api/metrics',
  alerts: '/api/alerts',

  gisLookup: '/api/gis/lookup',

  historicalPerformance: '/api/reports/historical-performance',
} as const