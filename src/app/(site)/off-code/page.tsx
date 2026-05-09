'use client'

import { useState } from 'react'

import TravelMap from '@/components/off-code/TravelMap'
import OverseasRouteMap from '@/components/off-code/OverseasRouteMap'

import { visitedCountries, visitedProvinces } from '@/data/travel'

import styles from './off-code.module.css'

export default function OffCodePage() {
  const [activeSource, setActiveSource] = useState<'indonesia' | 'overseas'>('indonesia')

  return (
    <main className={styles.page}>
      <section className={styles.section} aria-labelledby="off-code-title">
        <header className={styles.intro}>
          <p className={styles.kicker}>OFF CODE</p>
          <h1 id="off-code-title" className={styles.title}>
            Movement & Memory.
          </h1>
          <p className={styles.subtext}>
            Places leave their own notes.
          </p>
          <p className={styles.intent}>
            Some are quiet. Some stay.
          </p>
          <div className={styles.stats}>
            <button
              type="button"
              className={`${styles.statTab} ${
                activeSource === 'indonesia' ? styles.statTabActive : ''
              }`}
              onClick={() => setActiveSource('indonesia')}
            >
              {visitedProvinces.length} Indonesian provinces highlighted
            </button>
            <span className={styles.dot}>•</span>
            <button
              type="button"
              className={`${styles.statTab} ${
                activeSource === 'overseas' ? styles.statTabActive : ''
              }`}
              onClick={() => setActiveSource('overseas')}
            >
              {visitedCountries.length} overseas countries visited
            </button>
          </div>
        </header>

        <div className={styles.mapSpotlight}>
          {activeSource === 'indonesia' ? <TravelMap /> : <OverseasRouteMap />}
        </div>

        {activeSource === 'overseas' ? (
          <aside className={styles.overseas} aria-labelledby="overseas-title">
            <h2 id="overseas-title" className={styles.overseasTitle}>
              Overseas Notes
            </h2>
            <p className={styles.overseasHint}>The map is still unfinished.</p>
            <ul className={styles.overseasList}>
              {visitedCountries.map((visit) => (
                <li key={`${visit.country}-${visit.year}`} className={styles.overseasItem}>
                  <p className={styles.countryRow}>
                    <span className={styles.country}>
                      {visit.country}
                      {visit.city ? <span className={styles.city}> · {visit.city}</span> : null}
                    </span>
                    <span className={styles.year}>{visit.year}</span>
                  </p>
                  <p className={styles.note}>{visit.note}</p>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </section>
    </main>
  )
}
