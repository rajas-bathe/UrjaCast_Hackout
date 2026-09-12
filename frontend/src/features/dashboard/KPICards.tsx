import React from 'react'
import { CurrentWeatherCard } from './CurrentWeatherCard'
import { GenerationSummaryCard } from './GenerationSummaryCard'
import { GridStatusCard } from './GridStatusCard'
import type { CurrentWeather, DecisionResponse, ForecastResponse } from '@/lib/types'

interface KPICardsProps {
  weather: CurrentWeather | undefined
  weatherLoading: boolean
  forecast: ForecastResponse | null
  decision: DecisionResponse | null
}

export function KPICards({ weather, weatherLoading, forecast, decision }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <CurrentWeatherCard weather={weather} isLoading={weatherLoading} />
      <GenerationSummaryCard forecast={forecast} />
      <GridStatusCard decision={decision} />
    </div>
  )
}