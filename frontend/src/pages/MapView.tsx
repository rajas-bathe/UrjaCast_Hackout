import React, { useState, useMemo, useEffect } from 'react'
import * as turf from '@turf/turf'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Save, Play, LocateFixed, Loader2 } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MapContainer } from '@/components/map/MapContainer'
import { ShapefileLayer } from '@/components/map/ShapefileLayer'
import { SiteMarker } from '@/components/map/SiteMarker'
import { MapLegend } from '@/components/map/MapLegend'
import { CascadingDropdowns } from '@/features/mapView/CascadingDropdowns'
import { AssetConfigForm } from '@/features/mapView/AssetConfigForm'
import { GISLookupPanel } from '@/features/mapView/GISLookupPanel'
import { useGeospatialLayers } from '@/hooks/useGeospatial'
import { useRunForecast } from '@/hooks/useForecast'
import { useSiteStore } from '@/store/useSiteStore'
import { useForecastStore } from '@/store/useForecastStore'
import { useToast } from '@/components/ui/Toast'
import { DEFAULT_SOLAR_PARAMS } from '@/lib/constants'
import type { AssetParams, GISHierarchy, Site } from '@/lib/types'

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
  const addSavedSite = useSiteStore((s) => s.addSavedSite)
  const clearPending = useSiteStore((s) => s.clearPending)
  const setForecast = useForecastStore((s) => s.setForecast)

  const [siteName, setSiteName] = useState('')
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [nameError, setNameError] = useState(false)
  const assetParams: AssetParams = pendingAssetParams || DEFAULT_SOLAR_PARAMS

  const runForecast = useRunForecast()

  // ─── Grid fallback layer ───────────────────────────────────────
  const [gridLayer, setGridLayer] = useState<GeoJSON.FeatureCollection | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch('/shapefiles/gujarat_grid_5km.geojson')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.features)) setGridLayer(data)
      })
      .catch(() => {
        /* silent */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const isGridFallback = pendingGis?.resolutionLevel === 'grid'

  // ─── Panchayat dots for the current block ──────────────────────
  const visiblePanchayats = useMemo(() => {
    if (isGridFallback) return null
    if (!layers.panchayats?.features?.length) return null
    const block = pendingGis?.block
    if (!block || block === 'Unresolved Block') return null

    const target = String(block).toUpperCase().trim()

    const features = layers.panchayats.features.filter((f: any) => {
      const p = f.properties || {}
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
        (b) => String(b).toUpperCase().trim() === target,
      )
    })

    if (features.length === 0) return null
    return { ...layers.panchayats, features }
  }, [layers.panchayats, pendingGis?.block, isGridFallback])

  // ─── Single grid cell containing the click point ──────────────
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

  // ─── Helpers ───────────────────────────────────────────────────
  function handleMapClick(lat: number, lon: number) {
    setPendingLocation(lat, lon)
    const gis = resolvePoint(lat, lon)
    if (gis) setPendingGis(gis)
  }

  /** Look up a feature's centroid coordinates by name. Returns [lon, lat]. */
  function findFeatureCentroid(
    fc: GeoJSON.FeatureCollection | null,
    nameKeys: string[],
    targetName: string,
  ): [number, number] | null {
    if (!fc?.features?.length || !targetName) return null
    const target = String(targetName).toUpperCase().trim()

    const feature = fc.features.find((f: any) => {
      const p = f.properties || {}
      return nameKeys.some(
        (k) => p[k] && String(p[k]).toUpperCase().trim() === target,
      )
    })
    if (!feature || !feature.geometry) return null

    try {
      if (feature.geometry.type === 'Point') {
        const c = (feature.geometry as GeoJSON.Point).coordinates
        return [c[0], c[1]]
      }
      const c = turf.center(feature as any)
      const [lon, lat] = c.geometry.coordinates
      return [lon, lat]
    } catch {
      return null
    }
  }

  /**
   * Cascading dropdown handler with strict reset.
   *   - District changes → clear block + panchayat
   *   - Block changes    → clear panchayat
   *   - Panchayat changes → keep all
   *   - Marker always jumps to the most specific selection
   */
  function handleGisChange(newGis: GISHierarchy) {
    const prevDistrict = (pendingGis?.district || '').trim()
    const prevBlock = (pendingGis?.block || '').trim()

    const nextDistrict = (newGis.district || '').trim()
    const nextBlock = (newGis.block || '').trim()
    const nextPanchayat = (newGis.panchayat || '').trim()

    const normalized: GISHierarchy = {
      state: 'Gujarat',
      district: nextDistrict,
      block: nextBlock,
      panchayat: nextPanchayat,
    }

    // Reset block + panchayat if district changed
    if (prevDistrict !== nextDistrict) {
      normalized.block = ''
      normalized.panchayat = ''
    }
    // Reset panchayat if block changed (district unchanged)
    else if (prevBlock !== nextBlock) {
      normalized.panchayat = ''
    }

    setPendingGis(normalized)

    // Move marker to the most specific selection
    let coords: [number, number] | null = null

    if (normalized.panchayat && !normalized.panchayat.startsWith('Unresolved')) {
      coords = findFeatureCentroid(
        layers.panchayats,
        ['GPNAME', 'gpname', 'panchayat', 'name'],
        normalized.panchayat,
      )
    }

    if (
      !coords &&
      normalized.block &&
      !normalized.block.startsWith('Unresolved')
    ) {
      coords = findFeatureCentroid(
        layers.blocks,
        ['block_name', 'blkname', 'BLKNAME', 'block', 'BLOCK'],
        normalized.block,
      )
    }

    if (
      !coords &&
      normalized.district &&
      !normalized.district.startsWith('Unresolved')
    ) {
      coords = findFeatureCentroid(
        layers.districts,
        ['dtname', 'DTNAME', 'district', 'DISTRICT'],
        normalized.district,
      )
    }

    if (coords) {
      const [lon, lat] = coords
      setPendingLocation(lat, lon)
    }
  }

  /** Fetch the user's current position via the Geolocation API. */
  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by this browser.', 'error')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        setLocating(false)
        handleMapClick(lat, lon)
        showToast(
          `Location detected (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
          'success',
        )
      },
      (err) => {
        setLocating(false)
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Enable it in your browser.'
            : err.code === err.POSITION_UNAVAILABLE
            ? 'Location unavailable. Try again.'
            : 'Location request timed out.'
        showToast(msg, 'error')
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }

  /** Validate that a site can be built. Sets nameError if not. */
  function validate(): boolean {
    const nameOk = !!siteName.trim()
    const locationOk =
      pendingLatitude !== null && pendingLongitude !== null

    setNameError(!nameOk)

    if (!nameOk) {
      showToast('Please enter a site name.', 'error')
      return false
    }
    if (!locationOk) {
      showToast('Please select a location on the map.', 'error')
      return false
    }
    return true
  }

  function buildSite(): Site | null {
    if (!validate()) return null
    if (pendingLatitude === null || pendingLongitude === null) return null

    const gis = pendingGis || {
      state: 'Gujarat',
      district: 'Unresolved',
      block: 'Unresolved',
      panchayat: 'Unresolved',
    }

    const id = `site-${Date.now()}-${pendingLatitude.toFixed(
      3,
    )}-${pendingLongitude.toFixed(3)}`

    return {
      id,
      name: siteName.trim(),
      latitude: pendingLatitude,
      longitude: pendingLongitude,
      gis,
      assetParams,
      createdAt: new Date().toISOString(),
    }
  }

  function handleSaveSite() {
    const site = buildSite()
    if (!site) return
    try {
      setSaving(true)
      addSavedSite(site)
      showToast(`Saved "${site.name}" to your sites.`, 'success')
      setSiteName('')
      setNameError(false)
      clearPending()
    } finally {
      setSaving(false)
    }
  }

  async function handleRunForecast() {
    const site = buildSite()
    if (!site) return
    try {
      addSavedSite(site)
      setSelectedSite(site)
      const forecast = await runForecast.mutateAsync({
        siteId: site.id,
        assetParams,
      })
      setForecast(forecast)
      showToast('Forecast generated successfully.', 'success')
      navigate('/forecast')
    } catch (err: any) {
      showToast(err?.message || 'Failed to run forecast.', 'error')
    }
  }

  const isBusy = saving || runForecast.isPending

  return (
    <PageWrapper className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Site Selection</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {/* Site name input with inline validation */}
            <div>
              <Input
                label="Site Name"
                placeholder="e.g. 50 MW Solar Farm — Dholka"
                value={siteName}
                onChange={(e) => {
                  setSiteName(e.target.value)
                  if (nameError) setNameError(false)
                }}
                className={
                  nameError ? 'border-rose-400 focus:ring-rose-400' : ''
                }
              />
              {nameError && (
                <p className="mt-1 text-xs font-medium text-rose-500">
                  Please enter a site name.
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="w-full"
            >
              {locating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Locating…
                </>
              ) : (
                <>
                  <LocateFixed size={14} />
                  Use my location
                </>
              )}
            </Button>

            <GISLookupPanel
              latitude={pendingLatitude}
              longitude={pendingLongitude}
              gis={pendingGis}
            />

            <CascadingDropdowns
              layers={layers}
              gis={pendingGis}
              onChange={handleGisChange}
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

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={isBusy}
            onClick={handleSaveSite}
            className="w-full"
          >
            <Save size={14} />
            {saving && !runForecast.isPending ? 'Saving…' : 'Save Site'}
          </Button>
          <Button
            type="button"
            disabled={isBusy}
            onClick={handleRunForecast}
            className="w-full"
          >
            <Play size={14} />
            {runForecast.isPending ? 'Running…' : 'Run Forecast'}
          </Button>
        </div>

        <p className="text-center text-xs leading-relaxed text-slate-400">
          <strong className="text-slate-500">Save Site</strong> adds it to your
          library ·{' '}
          <strong className="text-slate-500">Run Forecast</strong> saves +
          generates the 72h forecast
        </p>
      </div>

      <div className="relative h-[520px] min-h-[520px] lg:h-full">
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

          {visiblePanchayats && (
            <ShapefileLayer
              data={visiblePanchayats}
              color="#10b981"
              weight={1}
              highlightName={pendingGis?.panchayat}
              highlightKey="GPNAME"
            />
          )}

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