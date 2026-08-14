'use client'

import dynamic from 'next/dynamic'
import { useCallback, useMemo, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import type { LatLng } from '@/lib/geo'
import { formatDistance, googleMapsDirectionsUrl, walkingMinutes } from '@/lib/geo'
import {
  availabilityLevel,
  estimateCost,
  generateParkingSpots,
  typeLabel,
  type ParkingSpot,
  type ParkingType,
} from '@/lib/parking-data'

const ParkingMap = dynamic(() => import('@/components/parking-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
      Loading map…
    </div>
  ),
})

type SortKey = 'distance' | 'price' | 'availability'

const ALL_TYPES: ParkingType[] = ['on-street', 'car-park', 'garage', 'private']

const AVAILABILITY_STYLES: Record<string, string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-red-100 text-red-800',
  full: 'bg-gray-200 text-gray-600',
}

const DURATIONS = [1, 2, 4, 8, 24]

export default function ParkingFinderPage() {
  const [origin, setOrigin] = useState<LatLng | null>(null)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const [maxPrice, setMaxPrice] = useState(10)
  const [selectedTypes, setSelectedTypes] = useState<Set<ParkingType>>(
    new Set(ALL_TYPES)
  )
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('distance')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const spots = useMemo(() => (origin ? generateParkingSpots(origin) : []), [origin])

  const useMyLocation = useCallback(() => {
    setError(null)
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser. Try searching an address instead.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude })
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
  }, [])

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
        setOrigin({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) })
      } catch {
        setError('Address lookup failed. Please try again.')
      } finally {
        setSearching(false)
      }
    },
    [query]
  )

  const toggleType = (type: ParkingType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const filteredSpots = useMemo(() => {
    let list = spots.filter(
      (s) => selectedTypes.has(s.type) && s.pricePerHour <= maxPrice
    )
    if (onlyAvailable) list = list.filter((s) => s.availableSpaces > 0)

    const sorted = [...list]
    if (sortKey === 'distance') sorted.sort((a, b) => a.distanceKm - b.distanceKm)
    if (sortKey === 'price') sorted.sort((a, b) => a.pricePerHour - b.pricePerHour)
    if (sortKey === 'availability')
      sorted.sort((a, b) => b.availableSpaces - a.availableSpaces)
    return sorted
  }, [spots, selectedTypes, maxPrice, onlyAvailable, sortKey])

  const selectedSpot = spots.find((s) => s.id === selectedId) ?? null

  if (!origin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">ParkFinder</h1>
          <p className="text-gray-600">
            Find nearby parking, compare prices, and check live availability
            — based on your location.
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
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
        <h1 className="text-lg font-bold text-gray-900">ParkFinder</h1>

        <form onSubmit={searchAddress} className="flex flex-1 min-w-[200px] gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a new location…"
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
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
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {locating ? 'Locating…' : '📍 My location'}
        </button>
      </header>

      {error && (
        <div className="bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-full max-w-sm flex-col border-r border-gray-200 bg-white">
          <div className="space-y-3 border-b border-gray-200 p-4">
            <div className="flex flex-wrap gap-1.5">
              {ALL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
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

            <div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Max price</span>
                <span>{maxPrice >= 10 ? 'Any' : `£${maxPrice.toFixed(2)}/hr`}</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={10}
                step={0.5}
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                />
                Available only
              </label>

              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs"
              >
                <option value="distance">Sort: Nearest</option>
                <option value="price">Sort: Cheapest</option>
                <option value="availability">Sort: Most spaces</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredSpots.length === 0 && (
              <p className="p-4 text-sm text-gray-500">
                No parking matches your filters.
              </p>
            )}
            {filteredSpots.map((spot) => {
              const level = availabilityLevel(spot)
              const active = spot.id === selectedId
              return (
                <button
                  key={spot.id}
                  onClick={() => setSelectedId(spot.id)}
                  className={`block w-full border-b border-gray-100 p-3 text-left hover:bg-gray-50 ${
                    active ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{spot.name}</p>
                      <p className="text-xs text-gray-500">{typeLabel(spot.type)}</p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-bold text-gray-900">
                      £{spot.pricePerHour.toFixed(2)}/hr
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${AVAILABILITY_STYLES[level]}`}
                    >
                      {spot.availableSpaces}/{spot.totalSpaces} free
                    </span>
                    <span className="text-gray-500">{formatDistance(spot.distanceKm)} away</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">{walkingMinutes(spot.distanceKm)} min walk</span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="relative flex-1">
          <ParkingMap
            origin={origin}
            spots={filteredSpots}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>

      {selectedSpot && (
        <SpotDetail
          spot={selectedSpot}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  )
}

function SpotDetail({ spot, onClose }: { spot: ParkingSpot; onClose: () => void }) {
  const level = availabilityLevel(spot)
  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{spot.name}</h2>
            <p className="text-sm text-gray-500">
              {typeLabel(spot.type)} · Operated by {spot.operator}
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
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${AVAILABILITY_STYLES[level]}`}>
            {spot.availableSpaces} of {spot.totalSpaces} spaces free
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
            ★ {spot.rating.toFixed(1)}
          </span>
          {spot.hasEvCharging && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-800">
              ⚡ EV charging
            </span>
          )}
          {spot.hasDisabledBays && (
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs text-sky-800">
              ♿ Accessible bays
            </span>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Distance</dt>
            <dd className="font-medium text-gray-900">
              {formatDistance(spot.distanceKm)} ({walkingMinutes(spot.distanceKm)} min walk)
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Max stay</dt>
            <dd className="font-medium text-gray-900">
              {spot.maxStayHours === 1 ? '1 hour' : `${spot.maxStayHours} hours`}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-gray-500">Restrictions</dt>
            <dd className="font-medium text-gray-900">{spot.restrictions}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700">Estimated cost</p>
          <div className="mt-1.5 grid grid-cols-5 gap-1.5">
            {DURATIONS.map((h) => (
              <div
                key={h}
                className="rounded-lg border border-gray-200 p-2 text-center"
              >
                <p className="text-[11px] text-gray-500">{h}h</p>
                <p className="text-sm font-semibold text-gray-900">
                  £{estimateCost(spot, h).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
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
