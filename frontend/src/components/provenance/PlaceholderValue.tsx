import React from 'react'
import { cn } from '@/lib/utils'

interface PlaceholderValueProps {
  className?: string
  text?: string
}

export function PlaceholderValue({ className, text }: PlaceholderValueProps) {
  return (
    <span className={cn('italic text-slate-400 text-xs', className)}>
      {text || 'TO BE FILLED AFTER FINAL MODEL VALIDATION'}
    </span>
  )
}