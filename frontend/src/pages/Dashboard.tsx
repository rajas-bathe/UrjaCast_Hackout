import React from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { KPICards } from '@/features/dashboard/KPICards'
import { QuickActions } from '@/features/dashboard/QuickActions'
import { AlertsFeed } from '@/features/dashboard/AlertsFeed'
import { useCurrentWeather } from '@/hooks/useWeather'
import { useAlerts } from '@/hooks/useForecast'
import { useAuthStore } from '@/store/useAuthStore'
import { useSiteStore } from '@/store/useSiteStore'
import { useForecastStore } from '@/store/useForecastStore'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const selectedSite = useSiteStore((s) => s.selectedSite)
  const forecast = useForecastStore((s) => s.forecast)
  const decision = useForecastStore((s) => s.decision)

  const lat = selectedSite?.latitude ?? 22.6
  const lon = selectedSite?.longitude ?? 71.6

  const { data: weather, isLoading: weatherLoading } = useCurrentWeather(lat, lon)
  const { data: alerts, isLoading: alertsLoading } = useAlerts()

  return (
    <PageWrapper>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Welcome back, {user?.name || 'there'}</h2>
          <p className="text-sm text-slate-400">Here's the latest overview of your renewable sites in Gujarat.</p>
        </div>

        <KPICards weather={weather} weatherLoading={weatherLoading} forecast={forecast} decision={decision} />
        <QuickActions />
        <AlertsFeed alerts={alerts} isLoading={alertsLoading} />
      </PageWrapper>
  )
}