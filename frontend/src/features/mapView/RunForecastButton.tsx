import React from 'react'
import { Loader2, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface RunForecastButtonProps {
  disabled: boolean
  isLoading: boolean
  onClick: () => void
}

export function RunForecastButton({ disabled, isLoading, onClick }: RunForecastButtonProps) {
  return (
    <Button className="w-full" size="lg" disabled={disabled || isLoading} onClick={onClick}>
      {isLoading ? <Loader2 size={18} className="animate-spin" /> : <PlayCircle size={18} />}
      {isLoading ? 'Generating forecast…' : 'Run Forecast'}
    </Button>
  )
}