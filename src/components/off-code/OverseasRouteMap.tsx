'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
} from 'react-simple-maps'

import styles from './OverseasRouteMap.module.css'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

type Stop = {
  label: string
  coordinates: [number, number]
}

type RouteKey = 'singapore' | 'oslo'

const stops: Stop[] = [
  { label: 'Jakarta', coordinates: [106.8456, -6.2088] as [number, number] },
  { label: 'Kepri', coordinates: [104.0535, 1.1302] as [number, number] },
  { label: 'Singapore', coordinates: [103.8198, 1.3521] as [number, number] },
  { label: 'Qatar', coordinates: [51.531, 25.2854] as [number, number] },
  { label: 'Oslo', coordinates: [10.7522, 59.9139] as [number, number] },
]

const routeMap: Record<RouteKey, [number, number][]> = {
  singapore: [stops[0].coordinates, stops[1].coordinates, stops[2].coordinates],
  oslo: [stops[0].coordinates, stops[3].coordinates, stops[4].coordinates],
}

const routeDurationMs: Record<RouteKey, number> = {
  singapore: 2200,
  oslo: 3200,
}

function pointDistance(a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  return Math.sqrt(dx * dx + dy * dy)
}

function pointAtProgress(path: [number, number][], progress: number): [number, number] {
  if (path.length < 2) {
    return path[0] ?? [0, 0]
  }

  const clamped = Math.min(1, Math.max(0, progress))
  const lengths = path.slice(0, -1).map((point, index) => pointDistance(point, path[index + 1]))
  const total = lengths.reduce((sum, value) => sum + value, 0)
  const target = total * clamped

  let traversed = 0
  for (let i = 0; i < lengths.length; i += 1) {
    const segmentLength = lengths[i]
    const nextTraversed = traversed + segmentLength
    if (target <= nextTraversed) {
      const localProgress = segmentLength === 0 ? 0 : (target - traversed) / segmentLength
      const start = path[i]
      const end = path[i + 1]
      return [
        start[0] + (end[0] - start[0]) * localProgress,
        start[1] + (end[1] - start[1]) * localProgress,
      ]
    }
    traversed = nextTraversed
  }

  return path[path.length - 1]
}

export default function OverseasRouteMap() {
  const [activeRoute, setActiveRoute] = useState<RouteKey>('oslo')
  const [flightProgress, setFlightProgress] = useState(0)

  const activePath = useMemo(() => routeMap[activeRoute], [activeRoute])
  const planePosition = useMemo(
    () => pointAtProgress(activePath, flightProgress),
    [activePath, flightProgress]
  )

  useEffect(() => {
    let frameId = 0
    const duration = routeDurationMs[activeRoute]
    const start = performance.now()

    const tick = (time: number) => {
      const elapsed = time - start
      const progress = Math.min(1, elapsed / duration)
      setFlightProgress(progress)
      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frameId)
  }, [activeRoute])

  return (
    <div className={styles.wrap} aria-label="Overseas travel route visualization">
      <div className={styles.overlayControls}>
        <label htmlFor="overseas-route" className={styles.overlayLabel}>
          Destination
        </label>
        <select
          id="overseas-route"
          className={styles.overlaySelect}
          value={activeRoute}
          onChange={(event) => {
            setActiveRoute(event.target.value as RouteKey)
            setFlightProgress(0)
          }}
        >
          <option value="singapore">Singapore</option>
          <option value="oslo">Norway</option>
        </select>
      </div>

      <ComposableMap
        width={1440}
        height={640}
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 265, center: [16, 18] }}
        className={styles.map}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                className={styles.geo}
                style={{
                  default: {
                    display: /antarctica/i.test(
                      (geo.properties?.name as string | undefined) ?? ''
                    )
                      ? 'none'
                      : 'inline',
                  },
                  hover: {
                    display: /antarctica/i.test(
                      (geo.properties?.name as string | undefined) ?? ''
                    )
                      ? 'none'
                      : 'inline',
                  },
                  pressed: {
                    display: /antarctica/i.test(
                      (geo.properties?.name as string | undefined) ?? ''
                    )
                      ? 'none'
                      : 'inline',
                  },
                }}
              />
            ))
          }
        </Geographies>

        <Line
          from={stops[0].coordinates}
          to={stops[1].coordinates}
          className={activeRoute === 'singapore' ? styles.routeAActive : styles.routeA}
        />
        <Line
          from={stops[1].coordinates}
          to={stops[2].coordinates}
          className={activeRoute === 'singapore' ? styles.routeAActive : styles.routeA}
        />
        <Line from={stops[2].coordinates} to={stops[1].coordinates} className={styles.routeA} />
        <Line from={stops[1].coordinates} to={stops[0].coordinates} className={styles.routeA} />

        <Line
          from={stops[0].coordinates}
          to={stops[3].coordinates}
          className={activeRoute === 'oslo' ? styles.routeBActive : styles.routeB}
        />
        <Line
          from={stops[3].coordinates}
          to={stops[4].coordinates}
          className={activeRoute === 'oslo' ? styles.routeBActive : styles.routeB}
        />
        <Line from={stops[4].coordinates} to={stops[3].coordinates} className={styles.routeB} />
        <Line from={stops[3].coordinates} to={stops[0].coordinates} className={styles.routeB} />

        {stops.map((stop) => (
          <Marker key={stop.label} coordinates={stop.coordinates}>
            <circle r={3.5} className={styles.ring} />
            <circle r={1.8} className={styles.dot} />
          </Marker>
        ))}

        <Marker coordinates={planePosition}>
          {activeRoute === 'oslo' ? (
            <g className={styles.plane}>
              <path d="M -2.8 1.2 L 3 0 L -2.8 -1.2 L -1.4 0 Z" />
            </g>
          ) : (
            <g className={styles.ship}>
              <path d="M -3 1.3 L 3 1.3 L 2 2.2 L -2 2.2 Z" />
              <path d="M -0.8 1.2 L -0.8 -1.2 L 0.4 -0.2 L 0.4 1.2 Z" />
            </g>
          )}
        </Marker>
      </ComposableMap>
    </div>
  )
}
