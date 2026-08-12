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

function markerIcon(color: string, active: boolean) {
  const size = active ? 30 : 22
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:9999px;
      background:${color};border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
      ${active ? 'outline:3px solid rgba(37,99,235,0.5);' : ''}
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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
