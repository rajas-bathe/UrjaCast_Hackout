import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ENDPOINTS } from '@/lib/endpoints'
import type { CurrentWeather, WeatherResponse } from '@/lib/types'

export function useWeather(lat: number | null, lon: number | null, hours = 72) {
  return useQuery({
    queryKey: ['weather', lat, lon, hours],
    queryFn: async () => {
      const { data } = await api.get<WeatherResponse>(ENDPOINTS.weather, {
        params: { lat, lon, hours },
      })
      return data
    },
    enabled: lat !== null && lon !== null,
  })
}

export function useCurrentWeather(lat: number, lon: number) {
  return useQuery({
    queryKey: ['weather-current', lat, lon],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.weatherCurrent, {
        params: { lat, lon },
      })
      return data
    },
    enabled: Number.isFinite(lat) && Number.isFinite(lon),  // ← ADD
    staleTime: 10 * 60 * 1000,                              // 10 min — ADD
    refetchOnWindowFocus: false,                            // ← ADD
  })
}