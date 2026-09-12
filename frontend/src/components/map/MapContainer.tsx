import React from 'react'
import { MapContainer as LeafletMapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import { GUJARAT_CENTER, GUJARAT_DEFAULT_ZOOM } from '@/lib/constants'

interface ClickCaptureProps {
  onMapClick: (lat: number, lon: number) => void
}

function ClickCapture({ onMapClick }: ClickCaptureProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface MapContainerProps {
  onMapClick: (lat: number, lon: number) => void
  children?: React.ReactNode
}

export function MapContainer({ onMapClick, children }: MapContainerProps) {
  return (
    <LeafletMapContainer
      center={GUJARAT_CENTER}
      zoom={GUJARAT_DEFAULT_ZOOM}
      className="h-full w-full rounded-2xl"
      scrollWheelZoom
    >
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />
      <ClickCapture onMapClick={onMapClick} />
      {children}
    </LeafletMapContainer>
  )
}