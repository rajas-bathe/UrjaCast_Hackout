import React from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { downloadBlob, toCSV } from '@/lib/utils'
import type { ForecastResponse, Site, DecisionResponse, OperatingRequirement } from '@/lib/types'

interface DownloadButtonsProps {
  forecast: ForecastResponse | null
  site: Site | null
  decision: DecisionResponse | null
  operatingRequirement: OperatingRequirement
}

/**
 * Deterministic IST formatter for PDF tables.
 * Always returns "DD/MM/YYYY, HH:MM AM/PM" in Asia/Kolkata.
 * Avoids `toLocaleString()` inconsistencies across locales/browsers.
 */
function formatIST(iso: string, opts: { date?: boolean; time?: boolean } = { date: true, time: true }): string {
  if (!iso) return '—'
  // Ensure UTC interpretation
  const safe = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z'
  const d = new Date(safe)
  if (Number.isNaN(d.getTime())) return iso

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d)

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const date = `${get('day')}/${get('month')}/${get('year')}`
  const time = `${get('hour')}:${get('minute')} ${get('dayPeriod').toUpperCase()}`

  if (opts.date && opts.time) return `${date}, ${time}`
  if (opts.date) return date
  return time
}

export function DownloadButtons({ forecast, site, decision, operatingRequirement }: DownloadButtonsProps) {
  const siteName = site?.name || 'UrjaCast Site'

  function handlePDF() {
    const doc = new jsPDF()
    let currentY = 22

    // --- 1. Header ---
    doc.setFontSize(20)
    doc.setTextColor(31, 41, 55)
    doc.text('UrjaCast Forecast Report', 14, currentY)
    currentY += 8

    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text(`Generated on: ${formatIST(new Date().toISOString())} IST`, 14, currentY)
    currentY += 10

    // --- 2. Site Metadata ---
    autoTable(doc, {
      startY: currentY,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      body: [
        ['Site Name:', siteName, 'Coordinates:', site ? `${site.latitude.toFixed(4)}, ${site.longitude.toFixed(4)}` : 'N/A'],
        ['Location:', site ? `${site.gis.district}, ${site.gis.state}` : 'N/A', 'Asset Type:', site?.assetParams?.type?.toUpperCase() || 'N/A'],
      ],
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [31, 41, 55] },
        2: { fontStyle: 'bold', textColor: [31, 41, 55] },
      },
    })
    currentY = (doc as any).lastAutoTable.finalY + 15

    // --- 3. Forecast Summary ---
    if (forecast) {
      doc.setFontSize(14)
      doc.setTextColor(31, 41, 55)
      doc.text('Forecast Summary', 14, currentY)
      currentY += 5

      const avg24h = forecast.summary.total24hMWh
        ? (forecast.summary.total24hMWh / 24).toFixed(1)
        : '—'
      const avg72h = forecast.summary.total72hMWh
        ? (forecast.summary.total72hMWh / 72).toFixed(1)
        : String(forecast.summary.avgMW)

      autoTable(doc, {
        startY: currentY,
        head: [['Peak MW', 'Avg 24h (MW)', 'Avg 72h (MW)', 'Total 24h (MWh)', 'Total 72h (MWh)']],
        body: [[
          forecast.summary.peakMW,
          avg24h,
          avg72h,
          forecast.summary.total24hMWh,
          forecast.summary.total72hMWh,
        ]],
        headStyles: { fillColor: [16, 185, 129] },
      })
      currentY = (doc as any).lastAutoTable.finalY + 15

      // --- 4. Hourly Forecast Data ---
      doc.setFontSize(14)
      doc.setTextColor(31, 41, 55)
      doc.text('Hourly Forecast Data', 14, currentY)
      currentY += 5

      const series = forecast.combined || forecast.solar || forecast.wind || []
      autoTable(doc, {
        startY: currentY,
        head: [['Time (IST)', 'Predicted MW', 'P10 MW', 'P90 MW', 'Status']],
        body: series.map((h) => [
          formatIST(h.time),
          h.expectedMW,
          h.p10MW,
          h.p90MW,
          h.status.toUpperCase(),
        ]),
        headStyles: { fillColor: [31, 41, 55] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            if (data.cell.raw === 'SURPLUS') data.cell.styles.textColor = [245, 158, 11]
            if (data.cell.raw === 'SHORTFALL') data.cell.styles.textColor = [244, 63, 94]
          }
        },
      })
      currentY = (doc as any).lastAutoTable.finalY + 20
    } else {
      doc.text('No forecast has been generated yet.', 14, currentY)
      currentY += 15
    }

    // --- 5. Operational Context & Decision Engine ---
    if (decision && forecast) {
      doc.setFontSize(14)
      doc.setTextColor(31, 41, 55)
      doc.text('Operational Context & Decision Engine', 14, currentY)
      currentY += 5

      autoTable(doc, {
        startY: currentY,
        head: [['Export Limit (MW)', 'Load Requirement (MW)', 'Overall Grid Status']],
        body: [[
          operatingRequirement.exportLimitMW,
          operatingRequirement.loadRequirementMW,
          decision.status.toUpperCase(),
        ]],
        headStyles: { fillColor: [31, 41, 55] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            if (data.cell.raw === 'SHORTFALL') data.cell.styles.textColor = [244, 63, 94]
            if (data.cell.raw === 'SURPLUS') data.cell.styles.textColor = [245, 158, 11]
            if (data.cell.raw === 'NORMAL') data.cell.styles.textColor = [16, 185, 129]
          }
        },
      })
      currentY = (doc as any).lastAutoTable.finalY + 15

      if (decision.recommendations.length > 0) {
        doc.setFontSize(12)
        doc.setTextColor(31, 41, 55)
        doc.text('Recommended Actions', 14, currentY)
        currentY += 5

        autoTable(doc, {
          startY: currentY,
          head: [['Window (IST)', 'Action', 'Delta (MW)', 'Reason']],
          body: decision.recommendations.map((rec) => {
            const start = formatIST(rec.windowStart)
            const end = formatIST(rec.windowEnd, { date: false, time: true })
            return [
              `${start} – ${end}`,
              rec.action.replace(/-/g, ' ').toUpperCase(),
              rec.numbers.deltaMW,
              rec.reason,
            ]
          }),
          headStyles: { fillColor: [16, 185, 129] },
          columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 40 },
            2: { cellWidth: 20 },
            3: { cellWidth: 'auto' },
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 1) {
              if (data.cell.raw === 'PREPARE DISCHARGE' || data.cell.raw === 'ACTIVATE BACKUP') {
                data.cell.styles.textColor = [244, 63, 94]
              }
              if (data.cell.raw === 'CHARGE STORAGE' || data.cell.raw === 'SHIFT FLEXIBLE LOAD') {
                data.cell.styles.textColor = [245, 158, 11]
              }
            }
          },
        })
      }
    }

    // --- 6. Footer Disclaimer ---
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(
      'Disclaimer: This report contains model-derived data. It is not actual measured telemetry. All times are in IST.',
      14,
      doc.internal.pageSize.height - 10,
    )

    doc.save(`urjacast-report-${siteName.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  function handleCSV() {
    const series = forecast?.combined || forecast?.solar || forecast?.wind || []

    const rows = series.map((h) => ({
      Timestamp_UTC: h.time,
      Site_Name: siteName,
      Expected_MW: h.expectedMW,
      P10_MW: h.p10MW,
      P90_MW: h.p90MW,
      Status: h.status,
      Export_Limit_MW: operatingRequirement.exportLimitMW,
      Load_Requirement_MW: operatingRequirement.loadRequirementMW,
      Overall_Grid_Status: decision?.status || 'N/A',
    }))

    const csv = '\uFEFF' + toCSV(rows)
    downloadBlob(
      csv ||
        'Timestamp_UTC,Site_Name,Expected_MW,P10_MW,P90_MW,Status,Export_Limit_MW,Load_Requirement_MW,Overall_Grid_Status\n',
      `urjacast-forecast-${siteName.replace(/\s+/g, '-').toLowerCase()}.csv`,
      'text/csv',
    )
  }

  return (
    <div className="flex flex-wrap gap-4 mt-4">
      <Button
        variant="outline"
        onClick={handlePDF}
        className="border-urja-sage/60 text-urja-navy hover:bg-urja-cream/50 hover:border-urja-sage transition-all duration-200 shadow-sm"
      >
        <FileDown size={16} className="mr-2 text-urja-green" />
        Download PDF Report
      </Button>
      <Button
        variant="outline"
        onClick={handleCSV}
        className="border-urja-sage/60 text-urja-navy hover:bg-urja-cream/50 hover:border-urja-sage transition-all duration-200 shadow-sm"
      >
        <FileSpreadsheet size={16} className="mr-2 text-urja-green" />
        Export CSV Data
      </Button>
    </div>
  )
}