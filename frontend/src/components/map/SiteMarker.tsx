import React from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const siteIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:16px;height:16px;border-radius:9999px;background:#059669;border:3px solid white;box-shadow:0 0 0 2px rgba(5,150,105,0.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

interface SiteMarkerProps {
  latitude: number
  longitude: number
  label?: string
}

export function SiteMarker({ latitude, longitude, label }: SiteMarkerProps) {
  return (
    <Marker position={[latitude, longitude]} icon={siteIcon}>
      {label && (
        <Popup>
          <span className="text-xs font-medium">{label}</span>
        </Popup>
      )}
    </Marker>
  )
}