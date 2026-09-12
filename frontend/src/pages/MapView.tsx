// PATCHED: removed POST /api/sites persistence (hardcoded siteId "site-1"); added grid-fallback rendering — hide panchayat dots and highlight the containing 5km grid cell when gis.resolutionLevel === "grid"
import React, { useState, useMemo, useEffect } from 'react'
import * as turf from '@turf/turf'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { MapContainer } from '@/components/map/MapContainer'
import { ShapefileLayer } from '@/components/map/ShapefileLayer'
import { SiteMarker } from '@/components/map/SiteMarker'
import { MapLegend } from '@/components/map/MapLegend'
import { CascadingDropdowns } from '@/features/mapView/CascadingDropdowns'
import { AssetConfigForm } from '@/features/mapView/AssetConfigForm'
import { GISLookupPanel } from '@/features/mapView/GISLookupPanel'
import { RunForecastButton } from '@/features/mapView/RunForecastButton'
import { useGeospatialLayers } from '@/hooks/useGeospatial'
import { useRunForecast } from '@/hooks/useForecast'
import { useSiteStore } from '@/store/useSiteStore'
import { useForecastStore } from '@/store/useForecastStore'
import { useToast } from '@/components/ui/Toast'
import { DEFAULT_SOLAR_PARAMS } from '@/lib/constants'
import type { AssetParams } from '@/lib/types'

export default function MapView() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { layers, isEmpty, resolvePoint } = useGeospatialLayers()

  const pendingLatitude = useSiteStore((s) => s.pendingLatitude)
  const pendingLongitude = useSiteStore((s) => s.pendingLongitude)
  const pendingGis = useSiteStore((s) => s.pendingGis)
  const pendingAssetParams = useSiteStore((s) => s.pendingAssetParams)
  const setPendingLocation = useSiteStore((s) => s.setPendingLocation)
  const setPendingGis = useSiteStore((s) => s.setPendingGis)
  const setPendingAssetParams = useSiteStore((s) => s.setPendingAssetParams)
  const setSelectedSite = useSiteStore((s) => s.setSelectedSite)
  const setForecast = useForecastStore((s) => s.setForecast)

  const [siteName, setSiteName] = useState('')
  const assetParams: AssetParams = pendingAssetParams || DEFAULT_SOLAR_PARAMS

  const runForecast = useRunForecast()

  // ─── Grid fallback layer (inert/null until /shapefiles/gujarat_grid_5km.geojson exists) ───
  const [gridLayer, setGridLayer] = useState<GeoJSON.FeatureCollection | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch('/shapefiles/gujarat_grid_5km.geojson')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.features)) setGridLayer(data)
      })
      .catch(() => {
        // 404 or parse failure — silently skip, grid fallback stays inert
      })
    return () => {
      cancelled = true
    }
  }, [])

  const isGridFallback = pendingGis?.resolutionLevel === 'grid'

  // ─── Only render panchayat dots for the CURRENT block (hidden entirely in grid-fallback mode) ───
  const visiblePanchayats = useMemo(() => {
    if (isGridFallback) return null
    if (!layers.panchayats?.features?.length) return null
    const block = pendingGis?.block
    if (!block || block === 'Unresolved Block') return null

    const target = String(block).toUpperCase().trim()

    const features = layers.panchayats.features.filter((f: any) => {
      const p = f.properties || {}
      // Actual key in Gujarat LGD panchayat file is "blkname"
      const candidates = [
        p.blkname,
        p.BLKNAME,
        p.block_name,
        p.block,
        p.BLOCK,
        p.B_Pan_Name,
        p.BLOCK_NAME,
      ].filter(Boolean)

      return candidates.some(
        (b) => String(b).toUpperCase().trim() === target
      )
    })

    if (features.length === 0) return null
    return { ...layers.panchayats, features }
  }, [layers.panchayats, pendingGis?.block, isGridFallback])

  // ─── Only render the single grid cell containing the click point, when in grid-fallback mode ───
  const visibleGridCell = useMemo(() => {
    if (!isGridFallback) return null
    if (!gridLayer?.features?.length) return null
    if (pendingLatitude === null || pendingLongitude === null) return null

    const pt = turf.point([pendingLongitude, pendingLatitude])
    for (const feature of gridLayer.features) {
      if (!feature.geometry) continue
      const t = feature.geometry.type
      if (t !== 'Polygon' && t !== 'MultiPolygon') continue
      try {
        if (turf.booleanPointInPolygon(pt, feature as any)) {
          return { ...gridLayer, features: [feature] }
        }
      } catch {
        continue
      }
    }
    return null
  }, [gridLayer, isGridFallback, pendingLatitude, pendingLongitude])

  function handleMapClick(lat: number, lon: number) {
    setPendingLocation(lat, lon)
    const gis = resolvePoint(lat, lon)
    if (gis) {
      setPendingGis(gis)
    }
  }

  const canRun =
    pendingLatitude !== null && pendingLongitude !== null && !!siteName

  async function handleRunForecast() {
    if (!canRun || pendingLatitude === null || pendingLongitude === null) return
    try {
      const gis = pendingGis || {
        state: 'Gujarat',
        district: 'Unresolved',
        block: 'Unresolved',
        panchayat: 'Unresolved',
      }
      const siteId = 'site-1'
      setSelectedSite({
        id: siteId,
        name: siteName,
        latitude: pendingLatitude,
        longitude: pendingLongitude,
        gis,
        assetParams,
        createdAt: new Date().toISOString(),
      })
      const forecast = await runForecast.mutateAsync({
        siteId,
        assetParams,
      })
      setForecast(forecast)
      showToast('Forecast generated successfully.', 'success')
      navigate('/forecast')
    } catch (err: any) {
      showToast(err?.message || 'Failed to run forecast.', 'error')
    }
  }

  return (
    <PageWrapper className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Site Selection</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Input
              label="Site Name"
              placeholder="e.g. 50 MW Solar Farm — Dholka"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
            <GISLookupPanel
              latitude={pendingLatitude}
              longitude={pendingLongitude}
              gis={pendingGis}
            />
            <CascadingDropdowns
              layers={layers}
              gis={pendingGis}
              onChange={setPendingGis}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Configuration</CardTitle>
          </CardHeader>
          <AssetConfigForm
            value={assetParams}
            onChange={setPendingAssetParams}
          />
        </Card>

        <RunForecastButton
          disabled={!canRun}
          isLoading={runForecast.isPending}
          onClick={handleRunForecast}
        />
      </div>

      <div className="relative h-[520px] lg:h-full min-h-[520px]">
        {isEmpty && (
          <div className="absolute left-4 right-4 top-4 z-[1000] flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 shadow">
            <AlertTriangle size={14} />
            Shapefiles not yet loaded. Drop GeoJSON into /public/shapefiles/.
          </div>
        )}
        <MapContainer onMapClick={handleMapClick}>
          <ShapefileLayer data={layers.state} color="#0f172a" weight={2} />
          <ShapefileLayer data={layers.districts} color="#64748b" weight={1.5} />
          <ShapefileLayer
            data={layers.blocks}
            color="#059669"
            weight={1}
            dashArray="4 4"
          />

          {/* Only render dots for the selected block (hidden when in grid-fallback mode) */}
          {visiblePanchayats && (
            <ShapefileLayer
              data={visiblePanchayats}
              color="#10b981"
              weight={1}
              highlightName={pendingGis?.panchayat}
              highlightKey="GPNAME"
            />
          )}

          {/* Grid fallback: highlight only the single 5km cell containing the click point */}
          {visibleGridCell && (
            <ShapefileLayer
              data={visibleGridCell}
              color="#eab308"
              fillOpacity={0.25}
              weight={2}
              highlightName={pendingGis?.panchayat}
              highlightKey="grid_id"
            />
          )}

          {pendingLatitude !== null && pendingLongitude !== null && (
            <SiteMarker
              latitude={pendingLatitude}
              longitude={pendingLongitude}
              label={siteName || 'Selected site'}
            />
          )}
        </MapContainer>
        <MapLegend />
      </div>
    </PageWrapper>
  )
}