// PATCHED: FIX 1 (use shared KEYS for block/district resolution) + grid-fallback resolvePoint logic when a block has zero panchayats
import { useCallback, useEffect, useRef, useState } from 'react'
import * as turf from '@turf/turf'
import type { GISHierarchy } from '@/lib/types'

interface GeoJSONLayers {
  state: GeoJSON.FeatureCollection | null
  districts: GeoJSON.FeatureCollection | null
  blocks: GeoJSON.FeatureCollection | null
  panchayats: GeoJSON.FeatureCollection | null
}

async function fetchGeoJSON(path: string): Promise<GeoJSON.FeatureCollection | null> {
  try {
    const res = await fetch(path)
    if (!res.ok) return null
    const data = await res.json()
    if (!data || !Array.isArray(data.features)) return null
    return data as GeoJSON.FeatureCollection
  } catch {
    return null
  }
}

/** Try multiple key names until one returns a non-empty value. */
function pickProp(props: any, keys: string[]): string | null {
  if (!props) return null
  for (const k of keys) {
    const v = props[k]
    if (v != null && String(v).trim() !== '') return String(v)
  }
  return null
}

/** Property key variants per admin level, based on Gujarat LGD shapefiles. */
const KEYS = {
  state: ['STNAME', 'stname', 'state', 'STATE'],
  district: ['dtname', 'DTNAME', 'district', 'DISTRICT', 'D_Pan_Name'],
  block: ['block_name', 'blkname', 'BLKNAME', 'block', 'BLOCK', 'B_Pan_Name'],
  panchayat: [
    'GPNAME', 'gpname', 'GP_NAME', 'gp_name',
    'panchayat', 'PANCHAYAT', 'village', 'VILLAGE', 'name', 'NAME',
  ],
}

const GRID_PATH = '/shapefiles/gujarat_grid_5km.geojson'

/** Cached grid layer fetch — resolved once, reused, and silently null if the file 404s. */
let gridLayerPromise: Promise<GeoJSON.FeatureCollection | null> | null = null
function loadGridLayer(): Promise<GeoJSON.FeatureCollection | null> {
  if (!gridLayerPromise) {
    gridLayerPromise = fetchGeoJSON(GRID_PATH)
  }
  return gridLayerPromise
}

export function useGeospatialLayers() {
  const [layers, setLayers] = useState<GeoJSONLayers>({
    state: null,
    districts: null,
    blocks: null,
    panchayats: null,
  })
  const [isEmpty, setIsEmpty] = useState(false)
  const [loading, setLoading] = useState(true)
  const gridLayerRef = useRef<GeoJSON.FeatureCollection | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [state, districts, blocks, panchayats] = await Promise.all([
        fetchGeoJSON('/shapefiles/gujarat_state.geojson'),
        fetchGeoJSON('/shapefiles/gujarat_districts.geojson'),
        fetchGeoJSON('/shapefiles/gujarat_blocks.geojson'),
        fetchGeoJSON('/shapefiles/gujarat_panchayats.geojson'),
      ])
      if (cancelled) return
      setLayers({ state, districts, blocks, panchayats })
      const anyPopulated = [state, districts, blocks, panchayats].some(
        (l) => l && l.features && l.features.length > 0,
      )
      setIsEmpty(!anyPopulated)
      setLoading(false)
    }
    load()
    // Grid layer is optional/inert until the file exists — load it separately,
    // best-effort, and never let its absence affect isEmpty/loading state.
    loadGridLayer().then((grid) => {
      if (!cancelled) gridLayerRef.current = grid
    })
    return () => {
      cancelled = true
    }
  }, [])

const resolvePoint = useCallback(
  (lat: number, lon: number): GISHierarchy | null => {
    try {
      const pt = turf.point([lon, lat])

      // ---- 1. Resolve district + block from POLYGON layers ----
      const findPolygonFeature = (
        fc: GeoJSON.FeatureCollection | null,
      ): any | null => {
        if (!fc || !fc.features?.length) return null
        for (const feature of fc.features) {
          if (!feature.geometry) continue
          const t = feature.geometry.type
          if (t !== 'Polygon' && t !== 'MultiPolygon') continue
          try {
            if (turf.booleanPointInPolygon(pt, feature as any)) return feature
          } catch {
            continue
          }
        }
        return null
      }

      const blockFeature = findPolygonFeature(layers.blocks)
      const districtFeature =
        findPolygonFeature(layers.districts) || blockFeature

      const blockProps = blockFeature?.properties || {}
      const districtProps = districtFeature?.properties || {}

      const block = pickProp(blockProps, KEYS.block) || null
      const district = pickProp(districtProps, KEYS.district) || null
      const state = 'Gujarat'

      // ---- 2. Filter panchayat points to the resolved block, then nearest ----
      let panchayat: string | null = null
      let panchayatCountInBlock = 0

      if (layers.panchayats?.features?.length) {
        const panchayatFC = layers.panchayats
        const isPointLayer =
          panchayatFC.features[0]?.geometry?.type === 'Point'

        if (isPointLayer) {
          // Filter to same block (try multiple key names)
          const sameBlockPoints = panchayatFC.features.filter((f: any) => {
            const b = pickProp(f.properties, KEYS.block)
            if (!block || !b) return true // if we can't filter, keep all
            return String(b).toUpperCase() === String(block).toUpperCase()
          })

          panchayatCountInBlock = block ? sameBlockPoints.length : panchayatFC.features.length

          const pool = sameBlockPoints.length > 0 ? sameBlockPoints : panchayatFC.features

          let best: { dist: number; name: string | null } | null = null
          for (const f of pool) {
            const g: any = (f as any).geometry
            if (!g || g.type !== 'Point') continue
            const [plon, plat] = g.coordinates
            const d = (plon - lon) ** 2 + (plat - lat) ** 2
            if (!best || d < best.dist) {
              best = {
                dist: d,
                name: pickProp(f.properties, KEYS.panchayat),
              }
            }
          }
          // Accept if within ~10 km (0.01 deg²) — loose bound since points are sparse
          if (best && best.dist < 0.01) panchayat = best.name
        } else {
          // Polygon panchayat layer
          const f = findPolygonFeature(panchayatFC)
          panchayat = pickProp(f?.properties, KEYS.panchayat)
          panchayatCountInBlock = f ? 1 : 0
        }
      }

      // ---- 3. Grid fallback: only when the resolved block has ZERO panchayats ----
      if (!panchayat && block && panchayatCountInBlock === 0) {
        const gridFC = gridLayerRef.current
        if (gridFC?.features?.length) {
          const cell = findPolygonFeature(gridFC)
          if (cell) {
            const props = cell.properties || {}
            const gridId = pickProp(props, ['grid_id', 'GRID_ID']) || null
            const terrainClass =
              pickProp(props, ['terrain_class', 'TERRAIN_CLASS', 'terrainClass']) || undefined
            if (gridId) {
              return {
                state,
                district: district || pickProp(props, ['district', 'DISTRICT']) || 'Unresolved District',
                block: block || pickProp(props, ['block', 'BLOCK']) || 'Unresolved Block',
                panchayat: gridId,
                resolutionLevel: 'grid',
                terrainClass,
                gridFallback: true,
              }
            }
          }
        }
        // Grid file absent/404 or point falls outside any cell — fall through silently.
      }

      if (!panchayat && !block && !district) return null

      return {
        state,
        district: district || 'Unresolved District',
        block: block || 'Unresolved Block',
        panchayat: panchayat || 'Unresolved Panchayat',
        resolutionLevel: panchayat ? 'panchayat' : block ? 'block' : 'district',
      }
    } catch {
      return null
    }
  },
  [layers],
)

  return { layers, isEmpty, loading, resolvePoint }
}