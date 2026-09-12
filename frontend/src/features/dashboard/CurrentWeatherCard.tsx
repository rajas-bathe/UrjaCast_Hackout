import React from 'react'
import { Sun, Wind, Droplets } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { DataProvenanceBadge } from '@/components/provenance/DataProvenanceBadge'
import type { CurrentWeather } from '@/lib/types'

interface CurrentWeatherCardProps {
  weather: CurrentWeather | undefined
  isLoading: boolean
}

export function CurrentWeatherCard({ weather, isLoading }: CurrentWeatherCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Weather (Gujarat)</CardTitle>
        <DataProvenanceBadge type="model-derived" />
      </CardHeader>
      {isLoading || !weather ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-slate-900">{weather.tempC}°C</p>
            <p className="text-sm text-slate-500">{weather.condition}</p>
          </div>
          <div className="space-y-1 text-right text-xs text-slate-500">
            <div className="flex items-center justify-end gap-1.5">
              <Wind size={12} /> {weather.windSpeedMs} m/s
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <Droplets size={12} /> {weather.humidityPct}%
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <Sun size={12} /> GHI {weather.ghi} W/m²
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}