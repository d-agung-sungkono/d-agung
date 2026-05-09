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
  { label: 'Singapore', coordinates: [103.8198, 1.3521] as [number, number] },
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

        <Line
          from={stops[0].coordinates}
          to={stops[1].coordinates}
          className={styles.routeSoft}
        />
        <Line
          from={stops[1].coordinates}
          to={stops[2].coordinates}
          className={styles.routeMain}
        />

        {stops.map((stop) => (
          <Marker key={stop.label} coordinates={stop.coordinates}>
            <circle r={3.5} className={styles.ring} />
            <circle r={1.8} className={styles.dot} />
          </Marker>
        ))}
      </ComposableMap>

      <div className={styles.legend}>
        <p className={styles.label}>Overseas Path</p>
        <p className={styles.meta}>Jakarta → Singapore (2023) → Oslo (2025)</p>
      </div>
    </div>
  )
}
