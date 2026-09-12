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

export function useCurrentWeather(lat: number | null, lon: number | null) {
  return useQuery({
    queryKey: ['weather-current', lat, lon],
    queryFn: async () => {
      const { data } = await api.get<CurrentWeather>(ENDPOINTS.weatherCurrent, {
        params: { lat, lon },
      })
      return data
    },
    enabled: lat !== null && lon !== null,
  })
}