'use client'

import { useEffect, useRef, useState } from 'react'
import type { LatLng } from './geo'
import {
  boundsContain,
  boundsTooWide,
  overpassQuery,
  padBounds,
  parseOverpass,
  type Bounds,
  type ParkingSpot,
} from './parking-data'

const ENDPOINT = 'https://overpass-api.de/api/interpreter'

interface State {
  spots: ParkingSpot[]
  loading: boolean
  error: string | null
}

/**
 * Loads parking for the visible area from OpenStreetMap.
 *
 * Overpass is a shared, rate-limited public service, so requests are debounced,
 * superseded ones are aborted, and each response covers a padded area — small
 * pans reuse what's already loaded instead of hitting the API again.
 */
export function useParking(bounds: Bounds | null, reference: LatLng | null) {
  const [state, setState] = useState<State>({
    spots: [],
    loading: false,
    error: null,
  })
  const loadedArea = useRef<Bounds | null>(null)
  const inFlight = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!bounds || !reference) return

    if (boundsTooWide(bounds)) {
      loadedArea.current = null
      setState({ spots: [], loading: false, error: null })
      return
    }

    // Already covered by the last fetch; the caller re-ranks by distance itself.
    if (loadedArea.current && boundsContain(loadedArea.current, bounds)) return

    const timer = setTimeout(async () => {
      inFlight.current?.abort()
      const controller = new AbortController()
      inFlight.current = controller

      const area = padBounds(bounds)
      setState((s) => ({ ...s, loading: true, error: null }))

      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          body: `data=${encodeURIComponent(overpassQuery(area))}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Overpass returned ${res.status}`)

        const json = await res.json()
        loadedArea.current = area
        setState({
          spots: parseOverpass(json, reference),
          loading: false,
          error: null,
        })
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        // Leave whatever is already on screen rather than blanking the map.
        setState((s) => ({
          ...s,
          loading: false,
          error: "Couldn't load parking for this area. Try again shortly.",
        }))
      }
    }, 500)

    return () => clearTimeout(timer)
    // `reference` only affects ranking, which the caller recomputes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds])

  return state
}
