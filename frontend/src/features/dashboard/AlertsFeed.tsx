import React from 'react'
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import type { Alert } from '@/lib/types'

interface AlertsFeedProps {
  alerts: Alert[] | undefined
  isLoading: boolean
}

export function AlertsFeed({ alerts, isLoading }: AlertsFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !alerts || alerts.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle size={28} />}
          title="No alerts yet"
          description="Surplus and shortfall events will appear here once a forecast is running."
        />
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
              {alert.type === 'surplus' ? (
                <TrendingUp size={16} className="mt-0.5 text-amber-500" />
              ) : (
                <TrendingDown size={16} className="mt-0.5 text-rose-500" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">{alert.message}</p>
                <p className="mt-0.5 text-xs text-slate-400">{new Date(alert.time).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}