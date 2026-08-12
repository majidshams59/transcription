import { distanceKm, type LatLng } from './geo'

export type ParkingType = 'on-street' | 'car-park' | 'garage' | 'private'

export interface ParkingSpot {
  id: string
  name: string
  operator: string
  type: ParkingType
  position: LatLng
  pricePerHour: number
  maxDailyPrice: number
  totalSpaces: number
  availableSpaces: number
  maxStayHours: number
  hasEvCharging: boolean
  hasDisabledBays: boolean
  rating: number
  restrictions: string
  distanceKm: number
}

const TYPE_LABELS: Record<ParkingType, string> = {
  'on-street': 'On-street bay',
  'car-park': 'Car park',
  garage: 'Multi-storey garage',
  private: 'Private space',
}

const OPERATORS = [
  'CityPark',
  'NCP',
  'SecurePark',
  'Council Parking Services',
  'MetroPark',
  'QuickPark',
  'JustPark Host',
  'ParkWise',
]

const PLACE_WORDS = [
  'High Street',
  'Station Road',
  'Church Lane',
  'Market Square',
  'Victoria',
  'King Street',
  'Riverside',
  'Central Plaza',
  'Park Lane',
  'Mill Road',
  'Union Street',
  'Bridge Street',
  'Green Street',
  'North Quarter',
  'Old Town',
  'West End',
  'Elm Avenue',
  'Harbour View',
]

const RESTRICTIONS = [
  'Free after 6pm & Sundays',
  'Max stay 2 hours, 8am-6pm Mon-Sat',
  'No restrictions',
  '24/7 access',
  'Permit holders only after 6pm',
  'Free on bank holidays',
  'Height limit 2.1m',
]

/** Deterministic PRNG so the same location always renders the same spots. */
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFromLatLng(pos: LatLng): number {
  const key = `${pos.lat.toFixed(3)},${pos.lng.toFixed(3)}`
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

export function generateParkingSpots(
  origin: LatLng,
  count = 22
): ParkingSpot[] {
  const rand = mulberry32(seedFromLatLng(origin))
  const spots: ParkingSpot[] = []

  for (let i = 0; i < count; i++) {
    // Random point within roughly a 1.4km radius, biased towards closer in.
    const radiusKm = 0.15 + rand() ** 1.6 * 1.4
    const angle = rand() * Math.PI * 2
    const latOffset = (radiusKm / 111) * Math.cos(angle)
    const lngOffset =
      (radiusKm / (111 * Math.cos((origin.lat * Math.PI) / 180))) *
      Math.sin(angle)

    const position: LatLng = {
      lat: origin.lat + latOffset,
      lng: origin.lng + lngOffset,
    }

    const type = pick<ParkingType>(
      rand,
      ['on-street', 'car-park', 'garage', 'private'] as ParkingType[]
    )

    const basePrice =
      type === 'on-street'
        ? 1 + rand() * 2.5
        : type === 'private'
          ? 1.5 + rand() * 3
          : 2 + rand() * 4.5

    const totalSpaces =
      type === 'on-street'
        ? 1 + Math.floor(rand() * 6)
        : 20 + Math.floor(rand() * 380)

    const occupancy = rand()
    const availableSpaces = Math.max(
      0,
      Math.round(totalSpaces * (1 - occupancy))
    )

    const place = pick(rand, PLACE_WORDS)
    const name =
      type === 'on-street'
        ? `${place} (Pay & Display)`
        : type === 'garage'
          ? `${pick(rand, OPERATORS)} - ${place} Garage`
          : type === 'private'
            ? `${place} Driveway`
            : `${pick(rand, OPERATORS)} - ${place}`

    spots.push({
      id: `spot-${i}-${Math.round(position.lat * 1e5)}-${Math.round(position.lng * 1e5)}`,
      name,
      operator: pick(rand, OPERATORS),
      type,
      position,
      pricePerHour: Math.round(basePrice * 20) / 20,
      maxDailyPrice: Math.round(basePrice * (6 + rand() * 4) * 20) / 20,
      totalSpaces,
      availableSpaces,
      maxStayHours: pick(rand, [1, 2, 3, 4, 8, 24]),
      hasEvCharging: rand() > 0.75,
      hasDisabledBays: rand() > 0.5,
      rating: Math.round((3 + rand() * 2) * 10) / 10,
      restrictions: pick(rand, RESTRICTIONS),
      distanceKm: distanceKm(origin, position),
    })
  }

  return spots.sort((a, b) => a.distanceKm - b.distanceKm)
}

export function typeLabel(type: ParkingType): string {
  return TYPE_LABELS[type]
}

export function availabilityLevel(
  spot: ParkingSpot
): 'high' | 'medium' | 'low' | 'full' {
  if (spot.availableSpaces <= 0) return 'full'
  const ratio = spot.availableSpaces / spot.totalSpaces
  if (ratio > 0.4) return 'high'
  if (ratio > 0.15) return 'medium'
  return 'low'
}

export function estimateCost(spot: ParkingSpot, hours: number): number {
  const raw = spot.pricePerHour * hours
  return Math.min(raw, spot.maxDailyPrice * Math.ceil(hours / 24))
}
