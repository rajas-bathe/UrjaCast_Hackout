import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { DataProvenanceBadge } from '@/components/provenance/DataProvenanceBadge'
import type {
  BackupConfig,
  FlexibleLoadConfig,
  OperatingRequirement,
  StorageConfig,
} from '@/lib/types'

interface ManualOverrideSlidersProps {
  operatingRequirement: OperatingRequirement
  storage: StorageConfig
  flexibleLoad: FlexibleLoadConfig
  backup: BackupConfig
  onOperatingRequirementChange: (o: OperatingRequirement) => void
  onStorageChange: (s: StorageConfig) => void
  onFlexibleLoadChange: (f: FlexibleLoadConfig) => void
  onBackupChange: (b: BackupConfig) => void
}

export function ManualOverrideSliders({
  operatingRequirement,
  storage,
  flexibleLoad,
  backup,
  onOperatingRequirementChange,
  onStorageChange,
  onFlexibleLoadChange,
  onBackupChange,
}: ManualOverrideSlidersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Override</CardTitle>
      </CardHeader>
      <CardDescription>
        Adjust thresholds and flexibility to see recommendations update live.
      </CardDescription>

      {/* Operating thresholds — these determine what's surplus/shortfall */}
      <div className="mt-4 space-y-5 border-b border-slate-100 pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Operating thresholds
        </p>
        <Slider
          label="Load Requirement"
          value={operatingRequirement.loadRequirementMW}
          min={0}
          max={50}
          unit=" MW"
          onChange={(v) =>
            onOperatingRequirementChange({
              ...operatingRequirement,
              loadRequirementMW: v,
            })
          }
        />
        <Slider
          label="Export Limit"
          value={operatingRequirement.exportLimitMW}
          min={10}
          max={100}
          unit=" MW"
          onChange={(v) =>
            onOperatingRequirementChange({
              ...operatingRequirement,
              exportLimitMW: v,
            })
          }
        />
      </div>

      {/* Flexibility assets */}
      <div className="mt-5 space-y-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Flexibility assets
        </p>
        <Slider
          label="Available Storage"
          value={storage.availableMWh}
          min={0}
          max={100}
          unit=" MWh"
          onChange={(v) => onStorageChange({ ...storage, availableMWh: v })}
        />
        <Slider
          label="Flexible Load"
          value={flexibleLoad.shiftableMW}
          min={0}
          max={30}
          unit=" MW"
          onChange={(v) => onFlexibleLoadChange({ shiftableMW: v })}
        />
        <Slider
          label="Backup Capacity"
          value={backup.capacityMW}
          min={0}
          max={30}
          unit=" MW"
          onChange={(v) => onBackupChange({ capacityMW: v })}
        />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3">
        <DataProvenanceBadge type="measured" />
        <p className="text-xs text-slate-500">
          Decision engine is rule-based and transparent. No ML.
        </p>
      </div>
    </Card>
  )
}