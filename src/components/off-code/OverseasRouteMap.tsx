'use client'

import { geoNaturalEarth1, geoPath } from 'd3-geo'
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson'
import { feature } from 'topojson-client'
import { useEffect, useMemo, useState } from 'react'

import styles from './OverseasRouteMap.module.css'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const VIEWBOX_WIDTH = 1440
const VIEWBOX_HEIGHT = 640

type Stop = {
  label: string
  coordinates: [number, number]
}

type RouteKey = 'singapore' | 'oslo'

type WorldAtlas = {
  objects?: {
    countries?: unknown
  }
}

const stops: Stop[] = [
  { label: 'Jakarta', coordinates: [106.8456, -6.2088] },
  { label: 'Kepri', coordinates: [104.0535, 1.1302] },
  { label: 'Singapore', coordinates: [103.8198, 1.3521] },
  { label: 'Qatar', coordinates: [51.531, 25.2854] },
  { label: 'Oslo', coordinates: [10.7522, 59.9139] },
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
  if (path.length < 2) return path[0] ?? [0, 0]

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

function linePath(points: [number, number][], project: (point: [number, number]) => [number, number] | null) {
  const projected = points.map(project).filter((point): point is [number, number] => point !== null)
  if (projected.length < 2) return null

  return projected
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')
}

export default function OverseasRouteMap() {
  const [activeRoute, setActiveRoute] = useState<RouteKey>('oslo')
  const [flightProgress, setFlightProgress] = useState(0)
  const [world, setWorld] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null)

  const activePath = useMemo(() => routeMap[activeRoute], [activeRoute])
  const planePosition = useMemo(
    () => pointAtProgress(activePath, flightProgress),
    [activePath, flightProgress]
  )

  useEffect(() => {
    const loadWorld = async () => {
      const response = await fetch(geoUrl)
      const data = (await response.json()) as WorldAtlas
      if (!data.objects?.countries) return

      const countries = feature(data as never, data.objects.countries as never) as unknown as FeatureCollection<
        Geometry,
        GeoJsonProperties
      >
      setWorld(countries)
    }

    void loadWorld()
  }, [])

  useEffect(() => {
    let frameId = 0
    const duration = routeDurationMs[activeRoute]
    const start = performance.now()

    const tick = (time: number) => {
      const elapsed = time - start
      const progress = Math.min(1, elapsed / duration)
      setFlightProgress(progress)
      if (progress < 1) frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [activeRoute])

  const projection = useMemo(() => {
    if (!world) return null
    return geoNaturalEarth1().fitSize([VIEWBOX_WIDTH, VIEWBOX_HEIGHT], world)
  }, [world])

  const pathBuilder = useMemo(() => {
    if (!projection) return null
    return geoPath(projection)
  }, [projection])

  const project = (point: [number, number]) => {
    if (!projection) return null
    const output = projection(point)
    return output ? ([output[0], output[1]] as [number, number]) : null
  }

  const singaporePath = linePath([stops[0].coordinates, stops[1].coordinates, stops[2].coordinates], project)
  const osloPath = linePath([stops[0].coordinates, stops[3].coordinates, stops[4].coordinates], project)
  const vehiclePoint = project(planePosition)

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

      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className={styles.map}
        role="img"
        aria-label="World map with overseas routes"
      >
        {world && pathBuilder
          ? world.features.map((item, index) => {
              const countryName = (item.properties?.name as string | undefined) ?? ''
              if (/antarctica/i.test(countryName)) return null

              const d = pathBuilder(item)
              if (!d) return null

              return <path key={`${item.id ?? index}`} d={d} className={styles.geo} />
            })
          : null}

        {singaporePath ? (
          <path
            d={singaporePath}
            className={activeRoute === 'singapore' ? styles.routeAActive : styles.routeA}
          />
        ) : null}

        {osloPath ? (
          <path d={osloPath} className={activeRoute === 'oslo' ? styles.routeBActive : styles.routeB} />
        ) : null}

        {stops.map((stop) => {
          const point = project(stop.coordinates)
          if (!point) return null

          return (
            <g key={stop.label} transform={`translate(${point[0]}, ${point[1]})`}>
              <circle r={3.5} className={styles.ring} />
              <circle r={1.8} className={styles.dot} />
            </g>
          )
        })}

        {vehiclePoint ? (
          <g transform={`translate(${vehiclePoint[0]}, ${vehiclePoint[1]})`}>
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
          </g>
        ) : null}
      </svg>
    </div>
  )
}
