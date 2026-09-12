import React from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { downloadBlob, toCSV } from '@/lib/utils'
import type { ForecastResponse } from '@/lib/types'

interface DownloadButtonsProps {
  forecast: ForecastResponse | null
  siteName?: string
}

export function DownloadButtons({ forecast, siteName = 'UrjaCast Site' }: DownloadButtonsProps) {
  function handlePDF() {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('UrjaCast Forecast Report', 14, 18)
    doc.setFontSize(10)
    doc.text(siteName, 14, 26)

    if (forecast) {
      autoTable(doc, {
        startY: 34,
        head: [['Peak MW', 'Avg MW', 'Total 24h MWh', 'Total 72h MWh']],
        body: [
          [
            forecast.summary.peakMW,
            forecast.summary.avgMW,
            forecast.summary.total24hMWh,
            forecast.summary.total72hMWh,
          ],
        ],
      })
    } else {
      doc.text('No forecast has been generated yet.', 14, 40)
    }

    doc.save('urjacast-report.pdf')
  }

  function handleCSV() {
    const series = forecast?.combined || forecast?.solar || forecast?.wind || []
    const rows = series.map((h) => ({
      time: h.time,
      expectedMW: h.expectedMW,
      p10MW: h.p10MW,
      p90MW: h.p90MW,
      status: h.status,
    }))
    const csv = toCSV(rows)
    downloadBlob(csv || 'time,expectedMW,p10MW,p90MW,status\n', 'urjacast-forecast.csv', 'text/csv')
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={handlePDF}>
        <FileDown size={16} />
        Download PDF Report
      </Button>
      <Button variant="outline" onClick={handleCSV}>
        <FileSpreadsheet size={16} />
        Export CSV Data
      </Button>
    </div>
  )
}