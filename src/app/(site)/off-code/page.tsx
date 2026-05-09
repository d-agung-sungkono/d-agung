import TravelMap from '@/components/off-code/TravelMap'
import OverseasRouteMap from '@/components/off-code/OverseasRouteMap'

import { visitedCountries, visitedProvinces } from '@/data/travel'

import styles from './off-code.module.css'

export default function OffCodePage() {
  return (
    <main className={styles.page}>
      <section className={styles.section} aria-labelledby="off-code-title">
        <header className={styles.intro}>
          <p className={styles.kicker}>OFF CODE</p>
          <h1 id="off-code-title" className={styles.title}>
            Systems are not only learned from code.
          </h1>
          <p className={styles.subtext}>
            Some perspectives come from movement - across cities, provinces, and
            countries.
          </p>
          <div className={styles.stats}>
            <p className={styles.stat}>{visitedProvinces.length} provinces highlighted</p>
            <span className={styles.dot}>•</span>
            <p className={styles.stat}>{visitedCountries.length} countries visited</p>
          </div>
        </header>

        <div className={styles.mapSpotlight}>
          <TravelMap />
        </div>

        <aside className={styles.overseas} aria-labelledby="overseas-title">
          <h2 id="overseas-title" className={styles.overseasTitle}>
            Overseas Visits
          </h2>
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

          <OverseasRouteMap />
        </aside>
      </section>
    </main>
  )
}
