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
 *
 * The grid is multi-resolution, like map tiles: each level halves the cell size
 * and is seeded independently, and a view shows every level up to the one that
 * suits its size. Zooming in therefore *adds* detail (the individual bays on a
 * street) while keeping the coarse spots (car parks) already on screen. A single
 * fixed cell size can't do both: sized for a city view it leaves street-level
 * zoom empty, and sized for a street it buries the city view in markers.
 */
const BASE_CELL_DEG = 0.008 // ~890m of latitude at level 0
const MAX_LEVEL = 8
const TARGET_FINEST_CELLS = 15 // cells of the finest level across the viewport
const MAX_SPOTS = 90
const MAX_LEVEL0_CELLS = 150

function cellDeg(level: number): number {
  return BASE_CELL_DEG / 2 ** level
}

/** Finest grid level worth drawing for a viewport of this size. */
function detailLevel(bounds: Bounds): number {
  const spanLat = Math.max(bounds.north - bounds.south, 1e-9)
  const spanLng = Math.max(bounds.east - bounds.west, 1e-9)
  const wanted = Math.sqrt((spanLat * spanLng) / TARGET_FINEST_CELLS)
  const level = Math.round(Math.log2(BASE_CELL_DEG / wanted))
  return Math.min(MAX_LEVEL, Math.max(0, level))
}

function cellSeed(level: number, cx: number, cy: number): number {
  let h = 2166136261
  for (const v of [level, cx, cy]) {
    h ^= v
    h = Math.imul(h, 16777619)
  }
  return h
}

type SpotSeed = Omit<ParkingSpot, 'distanceKm'>

function spotsForCell(level: number, cx: number, cy: number): SpotSeed[] {
  const rand = mulberry32(cellSeed(level, cx, cy))
  const size = cellDeg(level)
  // Finer levels are sparser per cell; there are four times as many of them.
  const count = level === 0 ? 1 + Math.floor(rand() * 2) : rand() < 0.55 ? 1 : 0
  const spots: SpotSeed[] = []

  for (let i = 0; i < count; i++) {
    const position: LatLng = {
      lat: (cy + rand()) * size,
      lng: (cx + rand()) * size,
    }

    // Coarse cells carry the landmarks you'd pick out from a city view; the
    // finer levels that appear as you zoom in are mostly individual bays.
    const type =
      level === 0
        ? pick<ParkingType>(rand, ['car-park', 'garage', 'car-park', 'private'])
        : pick<ParkingType>(rand, ['on-street', 'on-street', 'on-street', 'private'])

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
      id: `spot-${level}-${cx}-${cy}-${i}`,
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

function cellRange(bounds: Bounds, level: number) {
  const size = cellDeg(level)
  return {
    x0: Math.floor(bounds.west / size),
    x1: Math.floor(bounds.east / size),
    y0: Math.floor(bounds.south / size),
    y1: Math.floor(bounds.north / size),
  }
}

/** True when the viewport covers so much ground that listing spots is useless. */
export function boundsTooWide(bounds: Bounds): boolean {
  const { x0, x1, y0, y1 } = cellRange(bounds, 0)
  return (x1 - x0 + 1) * (y1 - y0 + 1) > MAX_LEVEL0_CELLS
}

/**
 * Every spot in view, across all grid levels the viewport warrants, with
 * distances measured from `reference` (the user's location or searched
 * address) and nearest first.
 */
export function generateSpotsInBounds(
  bounds: Bounds,
  reference: LatLng
): ParkingSpot[] {
  if (boundsTooWide(bounds)) return []

  const finest = detailLevel(bounds)
  const spots: ParkingSpot[] = []

  for (let level = 0; level <= finest; level++) {
    const { x0, x1, y0, y1 } = cellRange(bounds, level)
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        for (const seed of spotsForCell(level, cx, cy)) {
          spots.push({
            ...seed,
            distanceKm: distanceKm(reference, seed.position),
          })
        }
      }
    }
  }

  // Keep the markers nearest the middle of the view so a wide viewport stays
  // legible, then present them nearest-first relative to the user.
  const centre: LatLng = {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2,
  }
  return spots
    .sort((a, b) => distanceKm(centre, a.position) - distanceKm(centre, b.position))
    .slice(0, MAX_SPOTS)
    .sort((a, b) => a.distanceKm - b.distanceKm)
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
