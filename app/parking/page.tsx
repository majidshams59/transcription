'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import type { LatLng } from '@/lib/geo'
import {
  distanceKm,
  formatDistance,
  googleMapsDirectionsUrl,
  walkingMinutes,
} from '@/lib/geo'
import {
  boundsTooWide,
  FEE_LABELS,
  FEE_MARKER_COLOR,
  typeLabel,
  withDistances,
  type Bounds,
  type FeeStatus,
  type ParkingSpot,
  type ParkingType,
} from '@/lib/parking-data'
import { useParking } from '@/lib/use-parking'

const ParkingMap = dynamic(() => import('@/components/parking-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
      Loading map…
    </div>
  ),
})

type SortKey = 'distance' | 'capacity' | 'price'

const ALL_TYPES: ParkingType[] = ['on-street', 'car-park', 'garage', 'private']
const ALL_FEES: FeeStatus[] = ['free', 'paid', 'unknown']

const FEE_STYLES: Record<FeeStatus, string> = {
  free: 'bg-green-100 text-green-800',
  paid: 'bg-blue-100 text-blue-800',
  unknown: 'bg-gray-200 text-gray-600',
}

export default function ParkingFinderPage() {
  // Where the user physically is (the blue dot) and where they're *looking*.
  // Panning moves the latter only, so the map centre acts as the current
  // address: results and distances follow the view.
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)
  const [centre, setCentre] = useState<LatLng | null>(null)
  const [placeName, setPlaceName] = useState<string | null>(null)
  // Bumping the token recentres the map; panning must not, or it would fight
  // the drag and loop.
  const [flyTarget, setFlyTarget] = useState<{
    position: LatLng
    token: number
  } | null>(null)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const [selectedTypes, setSelectedTypes] = useState<Set<ParkingType>>(
    new Set(ALL_TYPES)
  )
  const [selectedFees, setSelectedFees] = useState<Set<FeeStatus>>(
    new Set(ALL_FEES)
  )
  const [sortKey, setSortKey] = useState<SortKey>('distance')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [bounds, setBounds] = useState<Bounds | null>(null)
  // Narrow screens can only fit one pane at a time; both show side by side at md+.
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map')

  const { spots: loadedSpots, loading, error: loadError } = useParking(
    bounds,
    centre
  )

  // Ranking follows the map centre, so re-rank locally rather than refetching.
  const spots = useMemo(
    () => (centre ? withDistances(loadedSpots, centre) : []),
    [loadedSpots, centre]
  )
  const zoomedOutTooFar = bounds ? boundsTooWide(bounds) : false

  const handleBoundsChange = useCallback((next: Bounds) => {
    setBounds(next)
    setCentre({
      lat: (next.north + next.south) / 2,
      lng: (next.east + next.west) / 2,
    })
  }, [])

  const goTo = useCallback((position: LatLng) => {
    setCentre(position)
    setFlyTarget({ position, token: Date.now() })
  }, [])

  const useMyLocation = useCallback(() => {
    setError(null)
    if (!navigator.geolocation) {
      setError(
        'Geolocation is not supported in this browser. Try searching an address instead.'
      )
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(here)
        goTo(here)
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was denied. Search for an address instead.'
            : 'Could not determine your location. Search for an address instead.'
        )
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [goTo])

  // Name the area under the map centre. Debounced and distance-gated so a drag
  // produces one lookup, not one per frame; the label is a nicety, so a failed
  // or blocked request just leaves coordinates showing.
  const lastNamed = useRef<LatLng | null>(null)
  useEffect(() => {
    if (!centre) return
    if (lastNamed.current && distanceKm(lastNamed.current, centre) < 0.15) return

    setPlaceName(null)
    lastNamed.current = null

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&zoom=16&lat=${centre.lat}&lon=${centre.lng}`,
          { signal: controller.signal }
        )
        const data = await res.json()
        const a = data?.address ?? {}
        const name =
          a.neighbourhood ??
          a.suburb ??
          a.village ??
          a.town ??
          a.city_district ??
          a.city ??
          data?.name ??
          null
        if (name) {
          lastNamed.current = centre
          setPlaceName(name)
        }
      } catch {
        // Offline or rate-limited: coordinates remain.
      }
    }, 700)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [centre])

  const searchAddress = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!query.trim()) return
      setSearching(true)
      setError(null)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
            query
          )}`
        )
        const results = await res.json()
        if (!results?.length) {
          setError(`No location found for "${query}".`)
          return
        }
        goTo({
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon),
        })
      } catch {
        setError('Address lookup failed. Please try again.')
      } finally {
        setSearching(false)
      }
    },
    [query, goTo]
  )

  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  const filteredSpots = useMemo(() => {
    const list = spots.filter(
      (s) => selectedTypes.has(s.type) && selectedFees.has(s.fee)
    )
    const sorted = [...list]
    if (sortKey === 'distance') sorted.sort((a, b) => a.distanceKm - b.distanceKm)
    if (sortKey === 'capacity')
      sorted.sort((a, b) => (b.capacity ?? -1) - (a.capacity ?? -1))
    if (sortKey === 'price') {
      const rank = { free: 0, paid: 1, unknown: 2 }
      sorted.sort(
        (a, b) => rank[a.fee] - rank[b.fee] || a.distanceKm - b.distanceKm
      )
    }
    return sorted
  }, [spots, selectedTypes, selectedFees, sortKey])

  const selectedSpot = spots.find((s) => s.id === selectedId) ?? null

  if (!centre) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">ParkFinder</h1>
          <p className="text-gray-600">
            Find nearby parking from OpenStreetMap — car parks, on-street bays,
            and what they charge where it&apos;s been recorded.
          </p>
        </div>

        <button
          onClick={useMyLocation}
          disabled={locating}
          className="w-full max-w-xs rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow hover:bg-blue-700 disabled:opacity-60"
        >
          {locating ? 'Locating…' : 'Use my current location'}
        </button>

        <div className="flex w-full max-w-xs items-center gap-2 text-sm text-gray-400">
          <div className="h-px flex-1 bg-gray-200" />
          or
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={searchAddress} className="flex w-full max-w-xs gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter an address or city"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {searching ? '…' : 'Go'}
          </button>
        </form>

        {error && <p className="max-w-xs text-sm text-red-600">{error}</p>}
      </main>
    )
  }

  return (
    <main className="flex h-screen flex-col bg-gray-50">
      <header className="z-10 flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="order-1 text-lg font-bold text-gray-900 md:order-none">
          ParkFinder
        </h1>

        <form
          onSubmit={searchAddress}
          className="order-3 flex w-full gap-2 md:order-none md:w-auto md:flex-1"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a place…"
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-60"
          >
            {searching ? '…' : 'Search'}
          </button>
        </form>

        <button
          onClick={useMyLocation}
          disabled={locating}
          className="order-2 ml-auto whitespace-nowrap rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 md:order-none md:ml-0"
        >
          {locating ? 'Locating…' : '📍 My location'}
        </button>

        <div className="order-4 flex w-full gap-1 rounded-lg bg-gray-100 p-1 md:hidden">
          {(['map', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setMobileView(v)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium capitalize ${
                mobileView === v
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      {(error || loadError) && (
        <div className="bg-red-50 px-4 py-2 text-sm text-red-700">
          {error ?? loadError}
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 text-sm">
        <span aria-hidden>📍</span>
        <span className="truncate font-medium text-gray-900">
          {placeName ?? `${centre.lat.toFixed(4)}, ${centre.lng.toFixed(4)}`}
        </span>
        <span className="ml-auto whitespace-nowrap text-xs text-gray-500">
          {loading
            ? 'Loading…'
            : zoomedOutTooFar
              ? '—'
              : `${filteredSpots.length} nearby`}
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside
          className={`${
            mobileView === 'list' ? 'flex' : 'hidden'
          } w-full flex-col border-r border-gray-200 bg-white md:flex md:max-w-sm`}
        >
          <div className="space-y-3 border-b border-gray-200 p-4">
            <div className="flex flex-wrap gap-1.5">
              {ALL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedTypes((p) => toggle(p, type))}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    selectedTypes.has(type)
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  {typeLabel(type)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {ALL_FEES.map((fee) => (
                <button
                  key={fee}
                  onClick={() => setSelectedFees((p) => toggle(p, fee))}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    selectedFees.has(fee)
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  {FEE_LABELS[fee]}
                </button>
              ))}

              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="ml-auto rounded-md border border-gray-300 px-2 py-1 text-xs"
              >
                <option value="distance">Sort: Nearest</option>
                <option value="price">Sort: Free first</option>
                <option value="capacity">Sort: Largest</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {zoomedOutTooFar ? (
              <p className="p-4 text-sm text-gray-500">
                Zoom in to load parking for this area.
              </p>
            ) : loading && filteredSpots.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">Loading parking…</p>
            ) : filteredSpots.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">
                No parking recorded here matching your filters.
              </p>
            ) : (
              filteredSpots.map((spot) => (
                <button
                  key={spot.id}
                  onClick={() => setSelectedId(spot.id)}
                  className={`block w-full border-b border-gray-100 p-3 text-left hover:bg-gray-50 ${
                    spot.id === selectedId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {spot.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {typeLabel(spot.type)}
                      </p>
                    </div>
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${FEE_STYLES[spot.fee]}`}
                    >
                      {spot.charge ?? FEE_LABELS[spot.fee]}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{formatDistance(spot.distanceKm)} away</span>
                    <span className="text-gray-400">·</span>
                    <span>{walkingMinutes(spot.distanceKm)} min walk</span>
                    {spot.capacity != null && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span>{spot.capacity} spaces</span>
                      </>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <div
          className={`${
            mobileView === 'map' ? 'block' : 'hidden'
          } relative flex-1 md:block`}
        >
          <ParkingMap
            centre={centre}
            userLocation={userLocation}
            flyTarget={flyTarget}
            spots={filteredSpots}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onBoundsChange={handleBoundsChange}
          />
          {/* Crosshair: the centre is the search point, so it needs to be visible. */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2">
            <div className="h-5 w-5 rounded-full border-2 border-gray-700/70 bg-white/40 shadow-sm" />
          </div>

          <div className="pointer-events-none absolute bottom-3 left-1/2 z-[1000] flex -translate-x-1/2 gap-3 rounded-full bg-white/95 px-3 py-1.5 text-xs shadow-md">
            {zoomedOutTooFar ? (
              <span className="font-medium text-gray-600">
                Zoom in to load parking
              </span>
            ) : (
              ALL_FEES.map((fee) => (
                <span key={fee} className="flex items-center gap-1 text-gray-600">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: FEE_MARKER_COLOR[fee] }}
                  />
                  {FEE_LABELS[fee]}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedSpot && (
        <SpotDetail spot={selectedSpot} onClose={() => setSelectedId(null)} />
      )}
    </main>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  )
}

function SpotDetail({
  spot,
  onClose,
}: {
  spot: ParkingSpot
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{spot.name}</h2>
            <p className="text-sm text-gray-500">
              {typeLabel(spot.type)}
              {spot.operator ? ` · ${spot.operator}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${FEE_STYLES[spot.fee]}`}
          >
            {FEE_LABELS[spot.fee]}
          </span>
          {spot.hasEvCharging && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-800">
              ⚡ EV charging
            </span>
          )}
          {spot.disabledBays && (
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs text-sky-800">
              ♿ Accessible bays
            </span>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Fact
            label="Distance"
            value={`${formatDistance(spot.distanceKm)} (${walkingMinutes(
              spot.distanceKm
            )} min walk)`}
          />
          {spot.capacity != null && (
            <Fact label="Capacity" value={`${spot.capacity} spaces`} />
          )}
          {spot.maxStay && <Fact label="Max stay" value={spot.maxStay} />}
          {spot.access && <Fact label="Access" value={spot.access} />}
          {spot.openingHours && (
            <Fact label="Opening hours" value={spot.openingHours} />
          )}
        </dl>

        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <p className="text-sm font-medium text-gray-700">Tariff</p>
          <p className="mt-1 text-sm text-gray-900">
            {spot.charge ??
              (spot.fee === 'free'
                ? 'Free to park'
                : spot.fee === 'paid'
                  ? 'Paid — no tariff recorded in OpenStreetMap'
                  : 'Not recorded in OpenStreetMap')}
          </p>
          {!spot.charge && (
            <a
              href={spot.osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-blue-600 underline"
            >
              View or add details on OpenStreetMap
            </a>
          )}
        </div>

        <a
          href={googleMapsDirectionsUrl(spot.position)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 block w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700"
        >
          Get directions
        </a>
      </div>
    </div>
  )
}
