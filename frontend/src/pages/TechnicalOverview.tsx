import React, { useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import { Cpu, Database, Globe, Layers, LineChart as LineChartIcon, ShieldCheck } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { SYSTEM_ARCHITECTURE_MERMAID } from '@/lib/diagrams'

const techStack = [
  { label: 'Frontend', value: 'React + Tailwind CSS' },
  { label: 'Backend', value: 'Python + FastAPI' },
  { label: 'GIS', value: 'GeoJSON + GeoPandas + Shapely + Leaflet' },
  { label: 'Weather APIs', value: 'Open-Meteo (Forecast & Historical)' },
  { label: 'Solar Physics', value: 'pvlib' },
  { label: 'Machine Learning', value: 'XGBoost / scikit-learn' },
  { label: 'Database / Storage', value: 'PostgreSQL / Local Cache' },
]

const keyFeatures = [
  { icon: <Globe size={18} />, title: 'Site-aware forecasting', description: 'Map-based site selection with State → District → Block → Panchayat context.' },
  { icon: <LineChartIcon size={18} />, title: '24–72h renewable forecast', description: 'Hourly generation forecast with uncertainty where available.' },
  { icon: <Cpu size={18} />, title: 'Solar physics + ML', description: 'pvlib baseline + XGBoost correction.' },
  { icon: <Layers size={18} />, title: 'Wind power-curve forecasting', description: 'Turbine power curve + optional ML correction.' },
  { icon: <ShieldCheck size={18} />, title: 'Surplus / shortfall intelligence', description: 'Identify excess or deficit vs. operating requirement.' },
  { icon: <Database size={18} />, title: 'Action recommendations', description: 'Storage / load shift / backup / curtailment.' },
]

const dataFlowSteps = [
  '1. User selects site (lat/long or map click)',
  '2. GIS lookup (State → District → Block → Panchayat)',
  '3. Fetch weather data (72h forecast + historical)',
  '4. Add site & asset parameters (solar / wind)',
  '5. Run models (pvlib / power curve + XGBoost)',
  '6. Generate forecast (24–72h)',
  '7. Apply decision rules (surplus / shortfall)',
  '8. Display results (map + charts + actions)',
]

const dataSources = [
  'Open-Meteo (Weather Forecast)',
  'Open-Meteo (Historical Weather)',
  'Government of India (Panchayat GIS)',
  'Open-Meteo (Elevation)',
  'Public Solar/Wind Datasets (Generation Data)',
]

export default function TechnicalOverview() {
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'neutral' })
    if (mermaidRef.current) {
      mermaid
        .render('architecture-diagram', SYSTEM_ARCHITECTURE_MERMAID)
        .then(({ svg }) => {
          if (mermaidRef.current) mermaidRef.current.innerHTML = svg
        })
        .catch(() => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = '<p class="text-xs text-slate-400">Diagram unavailable.</p>'
          }
        })
    }
  }, [])

  return (
    <PageWrapper>
        <Card>
          <CardHeader>
            <CardTitle>System Architecture</CardTitle>
          </CardHeader>
          <div ref={mermaidRef} className="overflow-x-auto" />
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
            </CardHeader>
            <dl className="space-y-2 text-sm">
              {techStack.map((t) => (
                <div key={t.label} className="flex justify-between border-b border-slate-100 py-1.5 last:border-0">
                  <dt className="text-slate-500">{t.label}</dt>
                  <dd className="font-medium text-slate-800">{t.value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data & Reference Sources</CardTitle>
            </CardHeader>
            <ul className="space-y-2 text-sm text-slate-600">
              {dataSources.map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {keyFeatures.map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-100 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  {f.icon}
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800">{f.title}</p>
                <p className="mt-1 text-xs text-slate-500">{f.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Flow</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-3">
            {dataFlowSteps.map((step) => (
              <div key={step} className="flex-1 min-w-[140px] rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                {step}
              </div>
            ))}
          </div>
        </Card>
      </PageWrapper>
  )
}