import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'

const notes = [
  'Every feature is labelled as measured, model-derived, static geospatial, or simulated.',
  'No dataset statistics or performance numbers are invented anywhere in this platform.',
  'Synthetic wind-generation data is never presented as real plant telemetry.',
  'A clear distinction is maintained between forecast uncertainty and actual measured generation.',
  'Any metric not yet computed is shown as "TO BE FILLED AFTER FINAL MODEL VALIDATION".',
]

export function DataIntegrityNotes() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Integrity Notes</CardTitle>
        <ShieldCheck size={16} className="text-emerald-500" />
      </CardHeader>
      <ul className="space-y-2 text-xs text-slate-500">
        {notes.map((note, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
            {note}
          </li>
        ))}
      </ul>
    </Card>
  )
}