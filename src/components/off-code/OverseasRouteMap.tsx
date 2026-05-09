'use client'

import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
} from 'react-simple-maps'

import styles from './OverseasRouteMap.module.css'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const stops = [
  { label: 'Jakarta', coordinates: [106.8456, -6.2088] as [number, number] },
  { label: 'Kepri', coordinates: [104.0535, 1.1302] as [number, number] },
  { label: 'Singapore', coordinates: [103.8198, 1.3521] as [number, number] },
  { label: 'Qatar', coordinates: [51.531, 25.2854] as [number, number] },
  { label: 'Oslo', coordinates: [10.7522, 59.9139] as [number, number] },
]

export default function OverseasRouteMap() {
  return (
    <div className={styles.wrap} aria-label="Overseas travel route visualization">
      <ComposableMap projection="geoNaturalEarth1" className={styles.map}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography key={geo.rsmKey} geography={geo} className={styles.geo} />
            ))
          }
        </Geographies>

        <Line from={stops[0].coordinates} to={stops[1].coordinates} className={styles.routeA} />
        <Line from={stops[1].coordinates} to={stops[2].coordinates} className={styles.routeA} />
        <Line from={stops[2].coordinates} to={stops[1].coordinates} className={styles.routeA} />
        <Line from={stops[1].coordinates} to={stops[0].coordinates} className={styles.routeA} />

        <Line from={stops[0].coordinates} to={stops[3].coordinates} className={styles.routeB} />
        <Line from={stops[3].coordinates} to={stops[4].coordinates} className={styles.routeB} />
        <Line from={stops[4].coordinates} to={stops[3].coordinates} className={styles.routeB} />
        <Line from={stops[3].coordinates} to={stops[0].coordinates} className={styles.routeB} />

        {stops.map((stop) => (
          <Marker key={stop.label} coordinates={stop.coordinates}>
            <circle r={3.5} className={styles.ring} />
            <circle r={1.8} className={styles.dot} />
          </Marker>
        ))}
      </ComposableMap>

      <div className={styles.legend}>
        <p className={styles.label}>Overseas Path</p>
        <p className={styles.meta}>
          Route 1: Jakarta → Kepri → Singapore → Kepri → Jakarta (PP)
        </p>
        <p className={styles.meta}>
          Route 2: Jakarta → Qatar (transit) → Oslo → Qatar → Jakarta (PP)
        </p>
      </div>
    </div>
  )
}
