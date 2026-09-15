import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  DecisionResponse,
  ForecastResponse,
  OperatingRequirement,
  StorageConfig,
  FlexibleLoadConfig,
  BackupConfig,
} from '@/lib/types'

interface ForecastState {
  forecast: ForecastResponse | null
  decision: DecisionResponse | null
  viewMode: 'solar' | 'wind' | 'combined'
  operatingRequirement: OperatingRequirement
  storage: StorageConfig
  flexibleLoad: FlexibleLoadConfig
  backup: BackupConfig
  setForecast: (f: ForecastResponse) => void
  setDecision: (d: DecisionResponse) => void
  setViewMode: (m: 'solar' | 'wind' | 'combined') => void
  setOperatingRequirement: (o: OperatingRequirement) => void
  setStorage: (s: StorageConfig) => void
  setFlexibleLoad: (f: FlexibleLoadConfig) => void
  setBackup: (b: BackupConfig) => void
}

export const useForecastStore = create<ForecastState>()(
  persist(
    (set) => ({
      forecast: null,
      decision: null,
      viewMode: 'solar',
      operatingRequirement: { exportLimitMW: 40, loadRequirementMW: 10 },
      storage: { availableMWh: 25, maxChargeMW: 10, maxDischargeMW: 10 },
      flexibleLoad: { shiftableMW: 5 },
      backup: { capacityMW: 8 },
      setForecast: (f) => set({ forecast: f }),
      setDecision: (d) => set({ decision: d }),
      setViewMode: (m) => set({ viewMode: m }),
      setOperatingRequirement: (o) => set({ operatingRequirement: o }),
      setStorage: (s) => set({ storage: s }),
      setFlexibleLoad: (f) => set({ flexibleLoad: f }),
      setBackup: (b) => set({ backup: b }),
    }),
    { name: 'urjacast-forecast' },
  ),
)