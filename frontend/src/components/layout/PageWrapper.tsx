import React from 'react'
import { cn } from '@/lib/utils'

export function PageWrapper({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 md:p-8 space-y-6', className)} {...props} />
}