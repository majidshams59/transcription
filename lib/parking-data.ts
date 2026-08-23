import { distanceKm, type LatLng } from './geo'

export type ParkingType = 'on-street' | 'car-park' | 'garage' | 'private'

/** Whether parking costs money. OSM often simply doesn't say, and pretending
 *  otherwise would be worse than admitting it. */
export type FeeStatus = 'free' | 'paid' | 'unknown'

export interface ParkingSpot {
  id: string
  name: string
  operator: string | null
  type: ParkingType
  position: LatLng
  fee: FeeStatus
  /** Raw tariff text as recorded in OSM, e.g. "£2.40/hour". Rarely present. */
  charge: string | null
  capacity: number | null
  disabledBays: string | null
  maxStay: string | null
  openingHours: string | null
  access: string | null
  hasEvCharging: boolean
  osmUrl: string
  distanceKm: number
}

export interface Bounds {
  north: number
  south: number
  east: number
  west: number
}

const TYPE_LABELS: Record<ParkingType, string> = {
  'on-street': 'On-street bay',
  'car-park': 'Car park',
  garage: 'Multi-storey / underground',
  private: 'Private',
}

export function typeLabel(type: ParkingType): string {
  return TYPE_LABELS[type]
}

export const FEE_LABELS: Record<FeeStatus, string> = {
  free: 'Free',
  paid: 'Paid',
  unknown: 'Price not recorded',
}

export const FEE_MARKER_COLOR: Record<FeeStatus, string> = {
  free: '#16a34a',
  paid: '#2563eb',
  unknown: '#9ca3af',
}

/** Widening the fetched area means small pans reuse the last response. */
export function padBounds(b: Bounds, factor = 0.35): Bounds {
  const dLat = (b.north - b.south) * factor
  const dLng = (b.east - b.west) * factor
  return {
    north: b.north + dLat,
    south: b.south - dLat,
    east: b.east + dLng,
    west: b.west - dLng,
  }
}

export function boundsContain(outer: Bounds, inner: Bounds): boolean {
  return (
    outer.north >= inner.north &&
    outer.south <= inner.south &&
    outer.east >= inner.east &&
    outer.west <= inner.west
  )
}

/** Overpass times out on huge areas, and a city-wide list is useless anyway. */
export function boundsTooWide(b: Bounds): boolean {
  return (b.north - b.south) * (b.east - b.west) > 0.05
}

export function overpassQuery(b: Bounds): string {
  const bbox = `${b.south},${b.west},${b.north},${b.east}`
  return `[out:json][timeout:25];(node["amenity"="parking"](${bbox});way["amenity"="parking"](${bbox}););out center 400;`
}

interface OverpassElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

function toType(tags: Record<string, string>): ParkingType {
  const p = tags.parking
  if (p === 'street_side' || p === 'lane' || p === 'on_street') return 'on-street'
  if (
    p === 'multi-storey' ||
    p === 'underground' ||
    p === 'rooftop' ||
    p === 'garage_boxes'
  ) {
    return 'garage'
  }
  if (tags.access === 'private') return 'private'
  return 'car-park'
}

function toFee(tags: Record<string, string>): FeeStatus {
  const fee = tags.fee
  if (fee === 'no' || fee === 'none') return 'free'
  if (fee && fee !== 'unknown') return 'paid'
  // A recorded tariff implies it's paid even when `fee` itself is missing.
  return tags.charge || tags['fee:conditional'] ? 'paid' : 'unknown'
}

function toNumber(value: string | undefined): number | null {
  if (!value) return null
  const n = parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

export function parseOverpass(
  json: { elements?: OverpassElement[] },
  reference: LatLng
): ParkingSpot[] {
  const elements = json?.elements ?? []
  const spots: ParkingSpot[] = []

  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (lat == null || lng == null) continue

    const tags = el.tags ?? {}
    const type = toType(tags)
    const position = { lat, lng }

    spots.push({
      id: `${el.type}/${el.id}`,
      name: tags.name ?? tags.operator ?? typeLabel(type),
      operator: tags.operator ?? null,
      type,
      position,
      fee: toFee(tags),
      charge: tags.charge ?? tags['fee:conditional'] ?? null,
      capacity: toNumber(tags.capacity),
      disabledBays: tags['capacity:disabled'] ?? null,
      maxStay: tags.maxstay ?? null,
      openingHours: tags.opening_hours ?? null,
      access: tags.access ?? null,
      hasEvCharging: Boolean(tags['capacity:charging'] || tags.charging_station),
      osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      distanceKm: distanceKm(reference, position),
    })
  }

  return spots.sort((a, b) => a.distanceKm - b.distanceKm)
}

export function withDistances(
  spots: ParkingSpot[],
  reference: LatLng
): ParkingSpot[] {
  return spots
    .map((s) => ({ ...s, distanceKm: distanceKm(reference, s.position) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
}
