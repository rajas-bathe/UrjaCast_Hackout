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

  function handleLogout(e?: React.MouseEvent) {
    e?.stopPropagation()
    logout()
    navigate('/login')
  }

  function handleOpenProfile() {
    onCloseMobile()
    navigate('/profile')
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
          'fixed z-40 top-0 left-0 h-full w-60 bg-gradient-to-b from-emerald-600 via-emerald-700 to-slate-800 text-emerald-50 flex flex-col transition-transform md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* ── Brand ─────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Leaf size={18} className="text-white" />
          </div>
          <span className="text-white font-bold tracking-tight">UrjaCast</span>
        </div>

        {/* ── Nav ───────────────────────────────────────── */}
        <nav
          className="flex-1 overflow-y-auto py-4 px-3 space-y-1"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-white text-emerald-700 shadow-md'
                    : 'text-emerald-50/90 hover:bg-white/10 hover:text-white',
                )
              }
            >
              {iconMap[item.icon]}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* ── Profile → /profile, Logout button separate ── */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 rounded-2xl p-1 hover:bg-white/10 transition-colors">
            {/* Profile click target */}
            <button
              type="button"
              onClick={handleOpenProfile}
              aria-label="Open profile"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {user?.name || 'Guest'}
                </p>
                <p className="truncate text-xs text-emerald-50/70">
                  {user?.team || 'HEXABYTE'}
                </p>
              </div>
            </button>

            {/* Logout click target */}
            <button
              type="button"
              aria-label="Log out"
              onClick={handleLogout}
              className="shrink-0 rounded-xl p-2 text-emerald-50/70 hover:bg-white/10 hover:text-rose-200 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}