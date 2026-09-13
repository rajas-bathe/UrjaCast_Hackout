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
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-4 md:px-8">
      <div className="flex items-center gap-3">
        <button
          aria-label="Open navigation menu"
          onClick={onOpenMobile}
          className="rounded-xl p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 md:hidden"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="text-xs font-medium text-slate-400">Gujarat, India</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">
          <Wifi size={12} />
          {mock ? 'Mock backend connected' : 'Live backend connected'}
        </span>
        <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-sm font-semibold text-white shadow-sm sm:flex">
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  )
}