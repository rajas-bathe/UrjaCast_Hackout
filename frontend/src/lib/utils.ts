import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMW(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(digits)} MW`
}

export function formatMWh(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toLocaleString(undefined, { maximumFractionDigits: digits })} MWh`
}

export function formatPct(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(digits)}%`
}

/**
 * Ensure an ISO timestamp is parsed as UTC.
 * Open-Meteo + FastAPI return strings like "2026-09-15T08:00"
 * with no timezone marker — JS would otherwise treat them as
 * browser-local time. We append "Z" to force UTC interpretation.
 */
function parseAsUTC(iso: string): Date | null {
  if (!iso) return null
  // Already has Z or explicit ±HH:MM offset — parse as-is
  const hasTz = /[Zz]$/.test(iso) || /[+-]\d{2}:?\d{2}$/.test(iso)
  const safe = hasTz ? iso : iso + 'Z'
  const d = new Date(safe)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Format an ISO UTC timestamp as "H:MM AM/PM" in India Standard Time.
 * Used across the Forecast chart, Hourly table, Decision timeline,
 * and anywhere a time label is displayed.
 */
export function formatHourLabel(iso: string): string {
  const d = parseAsUTC(iso)
  if (!d) return iso
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  })
}

export function formatDayHourLabel(iso: string): string {
  const d = parseAsUTC(iso)
  if (!d) return iso
  return d.toLocaleString('en-IN', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  })
}

export function statusColor(status: 'normal' | 'surplus' | 'shortfall'): string {
  switch (status) {
    case 'surplus':
      return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'shortfall':
      return 'text-rose-600 bg-rose-50 border-rose-200'
    default:
      return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  }
}

export function statusDotColor(status: 'normal' | 'surplus' | 'shortfall'): string {
  switch (status) {
    case 'surplus':
      return 'bg-amber-500'
    case 'shortfall':
      return 'bg-rose-500'
    default:
      return 'bg-emerald-500'
  }
}

export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function toCSV(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => String(row[h])).join(','))
  }
  return lines.join('\n')
}