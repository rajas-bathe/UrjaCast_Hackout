import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  label?: string
  className?: string
  size?: number
}

export function LoadingSpinner({ label, className, size = 20 }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 text-slate-400', className)} role="status">
      <Loader2 size={size} className="animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}