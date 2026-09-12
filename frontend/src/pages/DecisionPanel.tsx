import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusIndicator } from '@/features/decision/StatusIndicator'
import { RecommendedActionsList } from '@/features/decision/RecommendedActionsList'
import { DecisionTimeline } from '@/features/decision/DecisionTimeline'
import { ManualOverrideSliders } from '@/features/decision/ManualOverrideSliders'
import { useRunDecision } from '@/hooks/useDecision'
import { useSiteStore } from '@/store/useSiteStore'
import { useForecastStore } from '@/store/useForecastStore'
import { useToast } from '@/components/ui/Toast'

export default function DecisionPanel() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const selectedSite = useSiteStore((s) => s.selectedSite)
  const forecast = useForecastStore((s) => s.forecast)
  const decision = useForecastStore((s) => s.decision)
  const setDecision = useForecastStore((s) => s.setDecision)
  const operatingRequirement = useForecastStore((s) => s.operatingRequirement)
  const storage = useForecastStore((s) => s.storage)
  const flexibleLoad = useForecastStore((s) => s.flexibleLoad)
  const backup = useForecastStore((s) => s.backup)
  const setStorage = useForecastStore((s) => s.setStorage)
  const setFlexibleLoad = useForecastStore((s) => s.setFlexibleLoad)
  const setBackup = useForecastStore((s) => s.setBackup)

  const runDecision = useRunDecision()

  useEffect(() => {
    if (!forecast || !selectedSite) return
    runDecision
      .mutateAsync({
        siteId: selectedSite.id,
        forecast,
        operatingRequirement,
        storage,
        flexibleLoad,
        backup,
      })
      .then((result) => setDecision(result))
      .catch(() => showToast('Failed to compute decision. Showing last known state.', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forecast, storage, flexibleLoad, backup, operatingRequirement])

  if (!forecast) {
    return (
      <PageWrapper>
          <EmptyState
            title="No forecast available"
            description="Run a forecast first so the decision engine has data to evaluate."
            actionLabel="Go to Map View"
            onAction={() => navigate('/map')}
          />
        </PageWrapper>
    )
  }

  return (
    <PageWrapper>
        <StatusIndicator decision={decision} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <RecommendedActionsList recommendations={decision?.recommendations || []} />
            <DecisionTimeline timeline={decision?.timeline || []} />
          </div>
          <ManualOverrideSliders
            storage={storage}
            flexibleLoad={flexibleLoad}
            backup={backup}
            onStorageChange={setStorage}
            onFlexibleLoadChange={setFlexibleLoad}
            onBackupChange={setBackup}
          />
        </div>
      </PageWrapper>
  )
}