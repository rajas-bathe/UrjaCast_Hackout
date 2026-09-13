import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, TrendingUp, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const actions = [
  { label: 'Configure New Site', icon: <Map size={18} />, path: '/map' },
  { label: 'Check Forecast', icon: <TrendingUp size={18} />, path: '/forecast' },
  { label: 'View Decisions', icon: <Zap size={18} />, path: '/decision' },
]

export function QuickActions() {
  const navigate = useNavigate()
  return (
    <div className="grid grid-cols-1 gap-3">
      {actions.map((action) => (
        <Card
          key={action.path}
          className="cursor-pointer rounded-2xl"
          onClick={() => navigate(action.path)}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              {action.icon}
            </div>
            <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-slate-700">
              {action.label}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}