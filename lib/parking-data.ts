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

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

export interface Bounds {
  north: number
  south: number
  east: number
  west: number
}

/**
 * Spots live on a fixed world grid rather than being scattered around whatever
 * point you happened to search. Each cell's contents are derived from its own
 * coordinates, so a given spot stays put as you pan — panning reveals new cells
 * instead of reshuffling everything, the way a real bbox-backed API behaves.
 */
const CELL_DEG = 0.008 // ~890m of latitude
const MAX_CELLS = 400

function cellSeed(cx: number, cy: number): number {
  let h = 2166136261
  h ^= cx
  h = Math.imul(h, 16777619)
  h ^= cy
  h = Math.imul(h, 16777619)
  return h
}

type SpotSeed = Omit<ParkingSpot, 'distanceKm'>

function spotsForCell(cx: number, cy: number): SpotSeed[] {
  const rand = mulberry32(cellSeed(cx, cy))
  const count = 1 + Math.floor(rand() * 2)
  const spots: SpotSeed[] = []

  for (let i = 0; i < count; i++) {
    const position: LatLng = {
      lat: (cy + rand()) * CELL_DEG,
      lng: (cx + rand()) * CELL_DEG,
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
      id: `spot-${cx}-${cy}-${i}`,
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
    })
  }

  return spots
}

function cellRange(bounds: Bounds) {
  return {
    x0: Math.floor(bounds.west / CELL_DEG),
    x1: Math.floor(bounds.east / CELL_DEG),
    y0: Math.floor(bounds.south / CELL_DEG),
    y1: Math.floor(bounds.north / CELL_DEG),
  }
}

/** True when the viewport covers so much ground that listing spots is useless. */
export function boundsTooWide(bounds: Bounds): boolean {
  const { x0, x1, y0, y1 } = cellRange(bounds)
  return (x1 - x0 + 1) * (y1 - y0 + 1) > MAX_CELLS
}

/**
 * All spots in the cells overlapping `bounds`, with distances measured from
 * `reference` (the user's location or searched address) and nearest first.
 */
export function generateSpotsInBounds(
  bounds: Bounds,
  reference: LatLng
): ParkingSpot[] {
  if (boundsTooWide(bounds)) return []

  const { x0, x1, y0, y1 } = cellRange(bounds)
  const spots: ParkingSpot[] = []

  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = x0; cx <= x1; cx++) {
      for (const seed of spotsForCell(cx, cy)) {
        spots.push({
          ...seed,
          distanceKm: distanceKm(reference, seed.position),
        })
      }
    }
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
