'use client'

import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import type { LatLng } from '@/lib/geo'
import {
  availabilityLevel,
  typeLabel,
  type ParkingSpot,
} from '@/lib/parking-data'

const AVAILABILITY_COLOR: Record<string, string> = {
  high: '#16a34a',
  medium: '#d97706',
  low: '#dc2626',
  full: '#6b7280',
}

// AppyParking-style pin: a badge sitting on a stem that comes to a point.
// The point (not the badge) is what's anchored to the spot's lat/lng, so it's
// unambiguous which exact curb/bay the marker refers to.
function markerIcon(color: string, active: boolean) {
  const badgeR = active ? 11 : 8
  const stemLen = active ? 16 : 13
  const w = badgeR * 2 + 8
  const cx = w / 2
  const cy = badgeR + 4
  const tipY = cy + badgeR + stemLen
  const h = tipY + 3

  return L.divIcon({
    className: '',
    html: `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;overflow:visible;">
        ${active ? `<circle cx="${cx}" cy="${cy}" r="${badgeR + 4}" fill="none" stroke="rgba(37,99,235,0.55)" stroke-width="3" />` : ''}
        <line x1="${cx}" y1="${cy + badgeR - 1}" x2="${cx}" y2="${tipY}" stroke="${color}" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="${cx}" cy="${tipY}" r="2.5" fill="${color}" stroke="white" stroke-width="1" />
        <circle cx="${cx}" cy="${cy}" r="${badgeR}" fill="${color}" stroke="white" stroke-width="2" />
      </svg>
    `,
    iconSize: [w, h],
    iconAnchor: [cx, tipY],
    popupAnchor: [0, -tipY],
  })
}

function originIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;border-radius:9999px;
      background:#2563eb;border:3px solid white;
      box-shadow:0 0 0 4px rgba(37,99,235,0.3);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function Recenter({ position }: { position: LatLng }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([position.lat, position.lng], map.getZoom(), { duration: 0.6 })
  }, [position.lat, position.lng, map])
  return null
}

interface ParkingMapProps {
  origin: LatLng
  spots: ParkingSpot[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function ParkingMap({
  origin,
  spots,
  selectedId,
  onSelect,
}: ParkingMapProps) {
  return (
    <MapContainer
      center={[origin.lat, origin.lng]}
      zoom={15}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter position={origin} />
      <Marker position={[origin.lat, origin.lng]} icon={originIcon()}>
        <Popup>You are here</Popup>
      </Marker>
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.position.lat, spot.position.lng]}
          icon={markerIcon(
            AVAILABILITY_COLOR[availabilityLevel(spot)],
            spot.id === selectedId
          )}
          eventHandlers={{ click: () => onSelect(spot.id) }}
        >
          <Popup>
            <div style={{ minWidth: 160 }}>
              <strong>{spot.name}</strong>
              <div>{typeLabel(spot.type)}</div>
              <div>£{spot.pricePerHour.toFixed(2)} / hour</div>
              <div>{spot.availableSpaces} of {spot.totalSpaces} free</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
