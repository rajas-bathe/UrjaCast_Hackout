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
  const { data: metrics } = useMetrics(selectedSite?.id || null)
  const { data: historical } = useHistoricalPerformance(selectedSite?.id || null)

  return (
    <PageWrapper>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MetricsTable metrics={metrics} />
          <DataIntegrityNotes />
        </div>
        <HistoricalPerformanceChart data={historical} />
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Download Reports</h3>
          <DownloadButtons forecast={forecast} siteName={selectedSite?.name} />
        </div>
      </PageWrapper>
  )
}