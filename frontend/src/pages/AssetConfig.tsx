import React, { useState } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AssetConfigForm } from '@/features/mapView/AssetConfigForm'
import { useSiteStore } from '@/store/useSiteStore'
import { useUpdateSite } from '@/hooks/useSites'
import { useToast } from '@/components/ui/Toast'
import { DEFAULT_SOLAR_PARAMS } from '@/lib/constants'
import type { AssetParams } from '@/lib/types'

export default function AssetConfig() {
  const selectedSite = useSiteStore((s) => s.selectedSite)
  const setSelectedSite = useSiteStore((s) => s.setSelectedSite)
  const [params, setParams] = useState<AssetParams>(selectedSite?.assetParams || DEFAULT_SOLAR_PARAMS)
  const updateSite = useUpdateSite()
  const { showToast } = useToast()

  async function handleSave() {
    if (!selectedSite) {
      showToast('Select a site on Map View first.', 'error')
      return
    }
    try {
      const updated = await updateSite.mutateAsync({ id: selectedSite.id, payload: { assetParams: params } })
      setSelectedSite(updated)
      showToast('Asset parameters saved.', 'success')
    } catch (err: any) {
      showToast(err?.message || 'Failed to save parameters.', 'error')
    }
  }

  return (
    <PageWrapper>
        <Card>
          <CardHeader>
            <CardTitle>{selectedSite ? selectedSite.name : 'No site selected'}</CardTitle>
          </CardHeader>
          <CardDescription>
            Configure DC/AC capacity, tilt, turbine specs and other physical asset parameters used by the
            forecasting models.
          </CardDescription>
          <div className="mt-4">
            <AssetConfigForm value={params} onChange={setParams} />
          </div>
          <Button className="mt-6" onClick={handleSave} disabled={updateSite.isPending}>
            {updateSite.isPending ? 'Saving…' : 'Save Parameters'}
          </Button>
        </Card>
      </PageWrapper>
  )
}