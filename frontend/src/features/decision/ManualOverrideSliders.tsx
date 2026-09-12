import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Slider } from '@/components/ui/Slider'
import { DataProvenanceBadge } from '@/components/provenance/DataProvenanceBadge'
import type { BackupConfig, FlexibleLoadConfig, StorageConfig } from '@/lib/types'

interface ManualOverrideSlidersProps {
  storage: StorageConfig
  flexibleLoad: FlexibleLoadConfig
  backup: BackupConfig
  onStorageChange: (s: StorageConfig) => void
  onFlexibleLoadChange: (f: FlexibleLoadConfig) => void
  onBackupChange: (b: BackupConfig) => void
}

export function ManualOverrideSliders({
  storage,
  flexibleLoad,
  backup,
  onStorageChange,
  onFlexibleLoadChange,
  onBackupChange,
}: ManualOverrideSlidersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Override</CardTitle>
      </CardHeader>
      <CardDescription>Adjust flexibility to see recommendations update live.</CardDescription>
      <div className="mt-4 space-y-5">
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
        <p className="text-xs text-slate-500">Decision engine is rule-based and transparent. No ML.</p>
      </div>
    </Card>
  )
}