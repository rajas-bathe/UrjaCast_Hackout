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

export function DownloadButtons({ forecast, site, decision, operatingRequirement }: DownloadButtonsProps) {
  const siteName = site?.name || 'UrjaCast Site'

  function handlePDF() {
    const doc = new jsPDF()
    let currentY = 22
    
    // --- 1. Header ---
    doc.setFontSize(20)
    doc.setTextColor(31, 41, 55) // urja-navy
    doc.text('UrjaCast Forecast Report', 14, currentY)
    currentY += 8
    
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, currentY)
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
        2: { fontStyle: 'bold', textColor: [31, 41, 55] } 
      }
    })
    currentY = (doc as any).lastAutoTable.finalY + 15

    // --- 3. Forecast Summary ---
    if (forecast) {
      doc.setFontSize(14)
      doc.setTextColor(31, 41, 55)
      doc.text('Forecast Summary', 14, currentY)
      currentY += 5

      autoTable(doc, {
        startY: currentY,
        head: [['Peak MW', 'Avg MW', 'Total 24h (MWh)', 'Total 72h (MWh)']],
        body: [[
          forecast.summary.peakMW,
          forecast.summary.avgMW,
          forecast.summary.total24hMWh,
          forecast.summary.total72hMWh,
        ]],
        headStyles: { fillColor: [16, 185, 129] }, // urja-green
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
        head: [['Time', 'Predicted MW', 'P10 MW', 'P90 MW', 'Status']],
        body: series.map(h => [
          new Date(h.time).toLocaleString(),
          h.expectedMW,
          h.p10MW,
          h.p90MW,
          h.status.toUpperCase()
        ]),
        headStyles: { fillColor: [31, 41, 55] }, // urja-navy
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            if (data.cell.raw === 'SURPLUS') data.cell.styles.textColor = [245, 158, 11] // urja-gold
            if (data.cell.raw === 'SHORTFALL') data.cell.styles.textColor = [244, 63, 94] // shortfall
          }
        }
      })
      currentY = (doc as any).lastAutoTable.finalY + 20 // Extra space before decision section
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

      // Operational Requirements Table
      autoTable(doc, {
        startY: currentY,
        head: [['Export Limit (MW)', 'Load Requirement (MW)', 'Overall Grid Status']],
        body: [[
          operatingRequirement.exportLimitMW,
          operatingRequirement.loadRequirementMW,
          decision.status.toUpperCase()
        ]],
        headStyles: { fillColor: [31, 41, 55] }, // urja-navy
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            if (data.cell.raw === 'SHORTFALL') data.cell.styles.textColor = [244, 63, 94] // shortfall
            if (data.cell.raw === 'SURPLUS') data.cell.styles.textColor = [245, 158, 11] // urja-gold
            if (data.cell.raw === 'NORMAL') data.cell.styles.textColor = [16, 185, 129] // urja-green
          }
        }
      })
      currentY = (doc as any).lastAutoTable.finalY + 15

      // Decision Recommendations Table
      if (decision.recommendations.length > 0) {
        doc.setFontSize(12)
        doc.setTextColor(31, 41, 55)
        doc.text('Recommended Actions', 14, currentY)
        currentY += 5

        autoTable(doc, {
          startY: currentY,
          head: [['Window', 'Action', 'Delta (MW)', 'Reason']],
          body: decision.recommendations.map(rec => [
            `${new Date(rec.windowStart).toLocaleDateString([], {day: '2-digit', month: '2-digit'})} ${new Date(rec.windowStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(rec.windowEnd).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
            rec.action.replace(/-/g, ' ').toUpperCase(),
            rec.numbers.deltaMW,
            rec.reason
          ]),
          headStyles: { fillColor: [16, 185, 129] }, // urja-green
          columnStyles: {
            0: { cellWidth: 45 },
            1: { cellWidth: 40 },
            2: { cellWidth: 20 },
            3: { cellWidth: 'auto' }
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 1) {
              if (data.cell.raw === 'PREPARE DISCHARGE' || data.cell.raw === 'ACTIVATE BACKUP') data.cell.styles.textColor = [244, 63, 94] // shortfall
              if (data.cell.raw === 'CHARGE STORAGE' || data.cell.raw === 'SHIFT FLEXIBLE LOAD') data.cell.styles.textColor = [245, 158, 11] // urja-gold
            }
          }
        })
      }
    }

    // --- 6. Footer Disclaimer ---
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text('Disclaimer: This report contains model-derived data. It is not actual measured telemetry.', 14, doc.internal.pageSize.height - 10)

    doc.save(`urjacast-report-${siteName.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  function handleCSV() {
    const series = forecast?.combined || forecast?.solar || forecast?.wind || []
    
    const rows = series.map((h) => ({
      Timestamp: h.time,
      Site_Name: siteName,
      Expected_MW: h.expectedMW,
      P10_MW: h.p10MW,
      P90_MW: h.p90MW,
      Status: h.status,
      // Adding operational context to CSV
      Export_Limit_MW: operatingRequirement.exportLimitMW,
      Load_Requirement_MW: operatingRequirement.loadRequirementMW,
      Overall_Grid_Status: decision?.status || 'N/A'
    }))

    const csv = '\uFEFF' + toCSV(rows)
    downloadBlob(
      csv || 'Timestamp,Site_Name,Expected_MW,P10_MW,P90_MW,Status,Export_Limit_MW,Load_Requirement_MW,Overall_Grid_Status\n', 
      `urjacast-forecast-${siteName.replace(/\s+/g, '-').toLowerCase()}.csv`, 
      'text/csv'
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