import React from 'react'
import { Menu, Wifi } from 'lucide-react'
import { isMockEnabled } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'

interface HeaderProps {
  title: string
  onOpenMobile: () => void
}

export function Header({ title, onOpenMobile }: HeaderProps) {
  const user = useAuthStore((s) => s.user)
  const mock = isMockEnabled()

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 md:px-8">
      <div className="flex items-center gap-3">
        <button
          aria-label="Open navigation menu"
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-400">Gujarat, India</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
          <Wifi size={12} />
          {mock ? 'Mock backend connected' : 'Live backend connected'}
        </span>
        <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 sm:flex">
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  )
}