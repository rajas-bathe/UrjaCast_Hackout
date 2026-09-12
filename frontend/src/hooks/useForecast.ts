import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ENDPOINTS } from '@/lib/endpoints'
import type { ForecastRequest, ForecastResponse } from '@/lib/types'

export function useRunForecast() {
  return useMutation({
    mutationFn: async (payload: ForecastRequest) => {
      const { data } = await api.post<ForecastResponse>(ENDPOINTS.forecast, payload)
      return data
    },
  })
}

export function useMetrics(siteId: string | null) {
  return useQuery({
    queryKey: ['metrics', siteId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.metrics, { params: { siteId } })
      return data
    },
    enabled: !!siteId,
  })
}

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.alerts)
      return data
    },
  })
}

export function useHistoricalPerformance(siteId: string | null) {
  return useQuery({
    queryKey: ['historical-performance', siteId],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.historicalPerformance, { params: { siteId } })
      return data
    },
    enabled: !!siteId,
  })
}