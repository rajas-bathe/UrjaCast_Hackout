import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Site, GISHierarchy, AssetParams } from '@/lib/types'

interface SiteState {
  // Currently active
  selectedSite: Site | null
  // Pending (map view draft)
  pendingLatitude: number | null
  pendingLongitude: number | null
  pendingGis: GISHierarchy | null
  pendingAssetParams: AssetParams | null
  // Persistent library of all created sites
  savedSites: Site[]

  setSelectedSite: (site: Site | null) => void
  setPendingLocation: (lat: number, lon: number) => void
  setPendingGis: (gis: GISHierarchy | null) => void
  setPendingAssetParams: (params: AssetParams | null) => void
  addSavedSite: (site: Site) => void
  removeSavedSite: (id: string) => void
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
      savedSites: [],

      setSelectedSite: (site) => set({ selectedSite: site }),

      setPendingLocation: (lat, lon) =>
        set({ pendingLatitude: lat, pendingLongitude: lon }),

      setPendingGis: (gis) => set({ pendingGis: gis }),

      setPendingAssetParams: (params) => set({ pendingAssetParams: params }),

      addSavedSite: (site) =>
        set((s) => ({
          savedSites: [site, ...s.savedSites.filter((x) => x.id !== site.id)],
        })),

      removeSavedSite: (id) =>
        set((s) => ({ savedSites: s.savedSites.filter((x) => x.id !== id) })),

      clearPending: () =>
        set({
          pendingLatitude: null,
          pendingLongitude: null,
          pendingGis: null,
          pendingAssetParams: null,
        }),
    }),
    {
      name: 'urjacast.sites',
      // Only persist these 3 fields — keeps storage lean (max 3 constraint)
      partialize: (state) => ({
        selectedSite: state.selectedSite,
        savedSites: state.savedSites,
        pendingGis: state.pendingGis,
      }),
    },
  ),
)