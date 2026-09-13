import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User as UserIcon,
  MapPin,
  Trash2,
  ExternalLink,
  Mail,
  Users,
  Sun,
  Wind,
  Plus,
} from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataProvenanceBadge } from '@/components/provenance/DataProvenanceBadge'
import { useAuthStore } from '@/store/useAuthStore'
import { useSiteStore } from '@/store/useSiteStore'
import { useToast } from '@/components/ui/Toast'

export default function Profile() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const savedSites = useSiteStore((s) => s.savedSites)
  const removeSavedSite = useSiteStore((s) => s.removeSavedSite)
  const setSelectedSite = useSiteStore((s) => s.setSelectedSite)

  const stats = useMemo(() => {
    const solar = savedSites.filter((s) => s.assetParams.type === 'solar').length
    const wind = savedSites.filter((s) => s.assetParams.type === 'wind').length
    const totalMW = savedSites.reduce((sum, s) => {
      const p: any = s.assetParams
      const solarMW = p.dcCapacityMW ?? 0
      const windMW = (p.ratedPowerMW ?? 0) * (p.numTurbines ?? 0)
      return sum + solarMW + windMW
    }, 0)
    return { solar, wind, totalMW: Math.round(totalMW) }
  }, [savedSites])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function handleOpenSite(siteId: string) {
    const site = savedSites.find((s) => s.id === siteId)
    if (!site) return
    setSelectedSite(site)
    showToast(`Loaded ${site.name}`, 'success')
    navigate('/forecast')
  }

  function handleDeleteSite(siteId: string) {
    removeSavedSite(siteId)
    showToast('Site removed', 'success')
  }

  return (
    <PageWrapper className="space-y-6">
      {/* ── Page header ─────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">
          Your account and configured renewable sites.
        </p>
      </div>

      {/* ── User info + stats ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-xl font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <UserIcon size={14} className="text-slate-400" />
                <span className="text-base font-semibold text-slate-900">
                  {user?.name || 'Demo User'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail size={14} className="text-slate-400" />
                {user?.email || 'demo@urjacast.local'}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users size={14} className="text-slate-400" />
                {user?.team || 'HEXABYTE'}
              </div>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Log out
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <DataProvenanceBadge type="measured" />
            <span>Stored locally in your browser · never sent to a server</span>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your portfolio</CardTitle>
          </CardHeader>
          <div className="space-y-3 text-sm">
            <Row label="Sites configured" value={savedSites.length} />
            <Row
              label="Solar sites"
              value={stats.solar}
              icon={<Sun size={12} className="text-amber-500" />}
            />
            <Row
              label="Wind sites"
              value={stats.wind}
              icon={<Wind size={12} className="text-sky-500" />}
            />
            <Row label="Total capacity" value={`${stats.totalMW} MW`} />
          </div>
        </Card>
      </div>

      {/* ── Saved sites ─────────────────────────────────────── */}
      <Card>
        {/* Header with Add new site button */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Saved sites
          </h3>
          <Button
            type="button"
            size="sm"
            onClick={() => navigate('/map')}
          >
            <Plus size={14} />
            New Site
          </Button>
        </div>

        <div className="px-6 pb-6">
          {savedSites.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <MapPin size={24} />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                No sites yet
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                Configure your first renewable site on the Map View. It will
                appear here.
              </p>
              <Button className="mt-4" onClick={() => navigate('/map')}>
                <Plus size={14} />
                Configure your first site
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {savedSites.map((site) => {
                const isSolar = site.assetParams.type === 'solar'
                const p: any = site.assetParams
                const capacity = isSolar
                  ? `${p.dcCapacityMW} MW`
                  : `${p.ratedPowerMW} MW × ${p.numTurbines} turbines`

                return (
                  <div
                    key={site.id}
                    className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300"
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg ${
                        isSolar
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-sky-100 text-sky-600'
                      }`}
                    >
                      {isSolar ? <Sun size={16} /> : <Wind size={16} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-slate-900">
                          {site.name}
                        </h3>
                        <Badge variant={isSolar ? 'warning' : 'success'}>
                          {isSolar ? 'Solar' : 'Wind'}
                        </Badge>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}{' '}
                        · {site.gis.panchayat}, {site.gis.block},{' '}
                        {site.gis.district}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                        <span>
                          <span className="text-slate-400">Capacity:</span>{' '}
                          {capacity}
                        </span>
                        {isSolar && (
                          <span>
                            <span className="text-slate-400">
                              Tilt / Azimuth:
                            </span>{' '}
                            {p.tiltDeg}° / {p.azimuthDeg}°
                          </span>
                        )}
                        {!isSolar && (
                          <span>
                            <span className="text-slate-400">Hub height:</span>{' '}
                            {p.hubHeightM} m
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenSite(site.id)}
                      >
                        <ExternalLink size={12} />
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSite(site.id)}
                        aria-label="Delete site"
                      >
                        <Trash2 size={12} className="text-rose-500" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>
    </PageWrapper>
  )
}

/* ── Small internal row component ────────────────────────── */
function Row({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate-500">
        {icon}
        {label}
      </span>
      <span className="font-medium tabular-nums text-slate-900">{value}</span>
    </div>
  )
}