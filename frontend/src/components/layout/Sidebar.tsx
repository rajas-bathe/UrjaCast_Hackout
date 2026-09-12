import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  TrendingUp,
  Zap,
  FileBarChart,
  Settings2,
  Cpu,
  LogOut,
  Leaf,
} from 'lucide-react'
import { NAV_ITEMS } from '@/lib/constants'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={18} />,
  Map: <Map size={18} />,
  TrendingUp: <TrendingUp size={18} />,
  Zap: <Zap size={18} />,
  FileBarChart: <FileBarChart size={18} />,
  Settings2: <Settings2 size={18} />,
  Cpu: <Cpu size={18} />,
}

interface SidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed z-40 top-0 left-0 h-full w-60 bg-slate-900 text-slate-300 flex flex-col transition-transform md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
            <Leaf size={18} className="text-white" />
          </div>
          <span className="text-white font-semibold tracking-tight">UrjaCast</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                )
              }
            >
              {iconMap[item.icon]}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name || 'Guest'}</p>
              <p className="truncate text-xs text-slate-400">{user?.team || 'HEXABYTE'}</p>
            </div>
            <button
              aria-label="Log out"
              onClick={handleLogout}
              className="text-slate-400 hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}