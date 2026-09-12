import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { ForecastHeader } from '@/features/forecast/ForecastHeader'
import { ForecastSummaryTable } from '@/features/forecast/ForecastSummaryTable'
import { HourlyDataTable } from '@/features/forecast/HourlyDataTable'
import { ForecastAreaChart } from '@/components/charts/ForecastAreaChart'
import { SolarWindToggle } from '@/components/charts/SolarWindToggle'
import { DataProvenanceBadge } from '@/components/provenance/DataProvenanceBadge'
import { Badge } from '@/components/ui/Badge'
import { useSiteStore } from '@/store/useSiteStore'
import { useForecastStore } from '@/store/useForecastStore'
import { CHART_COLORS } from '@/lib/constants'

export default function Forecast() {
  const navigate = useNavigate()
  const selectedSite = useSiteStore((s) => s.selectedSite)
  const forecast = useForecastStore((s) => s.forecast)
  const viewMode = useForecastStore((s) => s.viewMode)
  const setViewMode = useForecastStore((s) => s.setViewMode)
  const operatingRequirement = useForecastStore((s) => s.operatingRequirement)

  const series = forecast ? forecast[viewMode] || forecast.solar || forecast.wind || [] : []
  const color = viewMode === 'wind' ? CHART_COLORS.wind : CHART_COLORS.solar

  return (
    <PageWrapper>
        <ForecastHeader site={selectedSite} />

        {!forecast ? (
          <EmptyState
            title="No forecast yet"
            description="Select a site and asset parameters on Map View, then run a forecast."
            actionLabel="Go to Map View"
            onAction={() => navigate('/map')}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SolarWindToggle value={viewMode} onChange={setViewMode} />
              <div className="flex items-center gap-2">
                <DataProvenanceBadge type="model-derived" label="Open-Meteo" />
                <DataProvenanceBadge type="model-derived" label="pvlib baseline" />
                <DataProvenanceBadge type="model-derived" label="XGBoost correction" />
                {viewMode === 'wind' && <Badge variant="info">Wind path: simplified power-curve baseline</Badge>}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>72-Hour Generation Forecast</CardTitle>
              </CardHeader>
              {series.length === 0 ? (
                <EmptyState title={`No ${viewMode} forecast available`} description="Try switching the toggle above." />
              ) : (
                <ForecastAreaChart data={series} exportLimitMW={operatingRequirement.exportLimitMW} color={color} />
              )}
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
              <ForecastSummaryTable summary={forecast.summary} />
              <HourlyDataTable data={series} weatherLabel={viewMode === 'wind' ? 'Wind Speed' : 'GHI'} />
            </div>
          </>
        )}
      </PageWrapper>
  )
}