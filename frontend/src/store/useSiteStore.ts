import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AssetParams, GISHierarchy, Site } from '@/lib/types'

interface SiteState {
  selectedSite: Site | null
  pendingLatitude: number | null
  pendingLongitude: number | null
  pendingGis: GISHierarchy | null
  pendingAssetParams: AssetParams | null
  setPendingLocation: (lat: number, lon: number) => void
  setPendingGis: (gis: GISHierarchy) => void
  setPendingAssetParams: (params: AssetParams) => void
  setSelectedSite: (site: Site) => void
  clearPending: () => void
}

export const useSiteStore = create<SiteState>()(
  persist(
    (set) => ({
      selectedSite: null,
      pendingLatitude: null,
      pendingLongitude: null,
      pendingGis: null,
      pendingAssetParams: null,
      setPendingLocation: (lat, lon) => set({ pendingLatitude: lat, pendingLongitude: lon }),
      setPendingGis: (gis) => set({ pendingGis: gis }),
      setPendingAssetParams: (params) => set({ pendingAssetParams: params }),
      setSelectedSite: (site) => set({ selectedSite: site }),
      clearPending: () =>
        set({ pendingLatitude: null, pendingLongitude: null, pendingGis: null, pendingAssetParams: null }),
    }),
    { name: 'urjacast-site' },
  ),
)