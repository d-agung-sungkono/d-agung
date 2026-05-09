'use client'

import { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'

import indonesiaProvinces from '@/data/maps/indonesia-provinces.json'
import { visitedProvinces } from '@/data/travel'

import styles from './TravelMap.module.css'

type ProvinceGeo = {
  properties?: {
    Propinsi?: string
    province?: string
    name?: string
  }
}

type HoverState = {
  province: string
  cities: string[]
  isVisited: boolean
}

function normalizeProvince(value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, ' ').trim()

  if (normalized === 'kepulauan riau') {
    return 'riau'
  }

  if (normalized === 'di yogyakarta' || normalized === 'd.i. yogyakarta') {
    return 'daerah istimewa yogyakarta'
  }

  if (normalized === 'yogyakarta') {
    return 'daerah istimewa yogyakarta'
  }

  if (normalized === 'jakarta raya') {
    return 'dki jakarta'
  }

  if (normalized === 'banten') {
    return 'probanten'
  }

  if (normalized === 'papua barat') {
    return 'irian jaya barat'
  }

  return normalized
}

function cleanProvinceName(value: string) {
  return value
    .replace(/\bPRO\s*/gi, '')
    .replace(/NUSATENGGARA/gi, 'NUSA TENGGARA')
    .replace(/\s+/g, ' ')
    .trim()
}

function getProvinceName(geo: ProvinceGeo) {
  return cleanProvinceName(
    geo.properties?.Propinsi ?? geo.properties?.province ?? geo.properties?.name ?? 'Unknown Province'
  )
}

export default function TravelMap() {
  const [hovered, setHovered] = useState<HoverState | null>(null)

  const visitedByProvince = useMemo(() => {
    return new Map(visitedProvinces.map((item) => [normalizeProvince(item.province), item]))
  }, [])

  const hasGeographies =
    typeof indonesiaProvinces === 'object' &&
    indonesiaProvinces !== null &&
    Array.isArray((indonesiaProvinces as { features?: unknown[] }).features)

  if (!hasGeographies) {
    return (
      <div className={styles.placeholder}>
        Province GeoJSON is not available yet. Add the file to
        <code>src/data/maps/indonesia-provinces.json</code> to render the map.
      </div>
    )
  }

  return (
    <div className={styles.mapWrap}>
      <div className={styles.canvas}>
        <ComposableMap
          width={1440}
          height={640}
          projection="geoMercator"
          projectionConfig={{ center: [118, -2], scale: 1360 }}
          className={styles.map}
        >
          <ZoomableGroup center={[118, -2]} zoom={1.18}>
            <Geographies geography={indonesiaProvinces}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const provinceName = getProvinceName(geo as ProvinceGeo)
                  const visit = visitedByProvince.get(normalizeProvince(provinceName))
                  const isVisited = Boolean(visit)

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      className={`${styles.province} ${isVisited ? styles.visitedProvince : ''}`}
                      onMouseEnter={() => {
                        setHovered({
                          province: provinceName,
                          cities: visit?.cities ?? [],
                          isVisited,
                        })
                      }}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        default: {
                          fill: isVisited ? '#56d087' : 'rgba(17, 17, 17, 0.13)',
                          stroke: 'rgba(17, 17, 17, 0.28)',
                          strokeWidth: 0.52,
                          outline: 'none',
                        },
                        hover: {
                          fill: isVisited ? '#4cc47d' : 'rgba(17, 17, 17, 0.21)',
                          stroke: 'rgba(17, 17, 17, 0.44)',
                          strokeWidth: 0.6,
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        pressed: {
                          fill: isVisited ? '#44b472' : 'rgba(17, 17, 17, 0.25)',
                          outline: 'none',
                        },
                      }}
                    />
                  )
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <div className={styles.hoverInfo} aria-live="polite">
        {hovered ? (
          <>
            <p className={styles.hoverProvince}>{hovered.province}</p>
            <p className={styles.hoverMeta}>
              {hovered.isVisited
                ? `Visited${hovered.cities.length ? ` • ${hovered.cities.join(', ')}` : ''}`
                : 'Not visited yet'}
            </p>
          </>
        ) : (
          <>
            <p className={styles.hoverProvince}>Indonesia Provinces</p>
            <p className={styles.hoverMeta}>Hover to inspect province details.</p>
          </>
        )}
      </div>
    </div>
  )
}
