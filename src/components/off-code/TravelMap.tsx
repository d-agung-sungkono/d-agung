'use client'

import { geoMercator, geoPath } from 'd3-geo'
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson'
import { useMemo, useState } from 'react'

import indonesiaProvinces from '@/data/maps/indonesia-provinces.json'
import { visitedProvinces } from '@/data/travel'

import styles from './TravelMap.module.css'

type ProvinceFeature = Feature<Geometry, GeoJsonProperties>

type HoverState = {
  province: string
  cities: string[]
  isVisited: boolean
}

const VIEWBOX_WIDTH = 1440
const VIEWBOX_HEIGHT = 640

function normalizeProvince(value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, ' ').trim()

  if (normalized === 'kepulauan riau') return 'riau'
  if (normalized === 'di yogyakarta' || normalized === 'd.i. yogyakarta') {
    return 'daerah istimewa yogyakarta'
  }
  if (normalized === 'yogyakarta') return 'daerah istimewa yogyakarta'
  if (normalized === 'jakarta raya') return 'dki jakarta'
  if (normalized === 'banten') return 'probanten'
  if (normalized === 'papua barat') return 'irian jaya barat'

  return normalized
}

function cleanProvinceName(value: string) {
  return value
    .replace(/\bPRO\s*/gi, '')
    .replace(/NUSATENGGARA/gi, 'NUSA TENGGARA')
    .replace(/\s+/g, ' ')
    .trim()
}

function getProvinceName(feature: ProvinceFeature) {
  return cleanProvinceName(
    (feature.properties?.Propinsi as string | undefined) ??
      (feature.properties?.province as string | undefined) ??
      (feature.properties?.name as string | undefined) ??
      'Unknown Province'
  )
}

export default function TravelMap() {
  const [hovered, setHovered] = useState<HoverState | null>(null)

  const visitedByProvince = useMemo(
    () => new Map(visitedProvinces.map((item) => [normalizeProvince(item.province), item])),
    []
  )

  const featureCollection = useMemo(() => {
    if (
      typeof indonesiaProvinces !== 'object' ||
      indonesiaProvinces === null ||
      !Array.isArray((indonesiaProvinces as { features?: unknown[] }).features)
    ) {
      return null
    }

    return indonesiaProvinces as FeatureCollection<Geometry, GeoJsonProperties>
  }, [])

  const projection = useMemo(() => {
    if (!featureCollection) return null

    return geoMercator().fitSize([VIEWBOX_WIDTH, VIEWBOX_HEIGHT], featureCollection)
  }, [featureCollection])

  const pathBuilder = useMemo(() => {
    if (!projection) return null
    return geoPath(projection)
  }, [projection])

  if (!featureCollection || !pathBuilder) {
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
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className={styles.map}
          role="img"
          aria-label="Indonesia provinces map"
        >
          {featureCollection.features.map((feature, index) => {
            const provinceName = getProvinceName(feature)
            const visit = visitedByProvince.get(normalizeProvince(provinceName))
            const isVisited = Boolean(visit)
            const pathData = pathBuilder(feature)

            if (!pathData) return null

            return (
              <path
                key={`${feature.id ?? provinceName}-${index}`}
                d={pathData}
                className={`${styles.province} ${isVisited ? styles.visitedProvince : ''}`}
                fill={isVisited ? '#56d087' : 'rgba(17, 17, 17, 0.13)'}
                stroke="rgba(17, 17, 17, 0.28)"
                strokeWidth={0.52}
                onMouseEnter={() => {
                  setHovered({
                    province: provinceName,
                    cities: visit?.cities ?? [],
                    isVisited,
                  })
                }}
                onMouseLeave={() => setHovered(null)}
              />
            )
          })}
        </svg>
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
