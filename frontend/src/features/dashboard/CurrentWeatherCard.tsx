import React from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { DataProvenanceBadge } from '@/components/provenance/DataProvenanceBadge'
import { Cloud, Droplet, Sun, Wind } from 'lucide-react'
import type { CurrentWeather } from '@/lib/types'

interface CurrentWeatherCardProps {
  weather?: CurrentWeather | null
  isLoading?: boolean
  locationLabel?: string         // ← NEW
}

export function CurrentWeatherCard({
  weather,
  isLoading,
  locationLabel = 'Gujarat',     // fallback keeps old behavior
}: CurrentWeatherCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>Current Weather ({locationLabel})</CardTitle>
          <DataProvenanceBadge type="model-derived" />
        </div>
      </CardHeader>

      {isLoading || !weather ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : (
        <>
          <div className="text-4xl font-bold text-slate-900">
            {weather.tempC.toFixed(1)}°C
          </div>
          <p className="mt-1 text-sm text-slate-600">{weather.condition}</p>

          <div className="mt-4 space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Wind className="h-3.5 w-3.5" />
              <span>{weather.windSpeedMs.toFixed(2)} m/s</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplet className="h-3.5 w-3.5" />
              <span>{weather.humidityPct}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5" />
              <span>GHI {weather.ghi.toFixed(0)} W/m²</span>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}