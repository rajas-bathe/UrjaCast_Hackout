import React from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { MetricsTable } from '@/features/reports/MetricsTable'
import { DownloadButtons } from '@/features/reports/DownloadButtons'
import { DataIntegrityNotes } from '@/features/reports/DataIntegrityNotes'
import { HistoricalPerformanceChart } from '@/features/reports/HistoricalPerformanceChart'
import { useMetrics, useHistoricalPerformance } from '@/hooks/useForecast'
import { useSiteStore } from '@/store/useSiteStore'
import { useForecastStore } from '@/store/useForecastStore'

export default function Reports() {
  const selectedSite = useSiteStore((s) => s.selectedSite)
  const forecast = useForecastStore((s) => s.forecast)
  const decision = useForecastStore((s) => s.decision) // Get decision
  const operatingRequirement = useForecastStore((s) => s.operatingRequirement) // Get operating limits
  
  const { data: metrics } = useMetrics(selectedSite?.id || null)
  const { data: historical } = useHistoricalPerformance(selectedSite?.id || null)

  return (
    <PageWrapper>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MetricsTable metrics={metrics} />
          <DataIntegrityNotes />
        </div>
        <HistoricalPerformanceChart data={historical} />
        <div className="mt-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-urja-navy/60">
            Download Reports
          </h3>
          {/* Pass decision and operatingRequirement */}
          <DownloadButtons 
            forecast={forecast} 
            site={selectedSite} 
            decision={decision}
            operatingRequirement={operatingRequirement}
          />
        </div>
      </PageWrapper>
  )
}