import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionProps {
  title: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function Accordion({ title, children, defaultOpen = false, className }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cn('border border-slate-200 rounded-xl overflow-hidden', className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {title}
        <ChevronDown size={16} className={cn('transition-transform text-slate-400', open && 'rotate-180')} />
      </button>
      {open && <div className="px-4 pb-4 text-sm text-slate-600">{children}</div>}
    </div>
  )
}