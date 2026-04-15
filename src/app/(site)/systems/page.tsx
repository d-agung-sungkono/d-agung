import Link from 'next/link'

import { systems } from '@/data/systems'

import styles from './systems.module.css'

function formatStatus(status: string): string {
  return status.trim().replace('-', ' ')
}

export default function SystemsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Systems</p>
        <h1 className={styles.title}>Real systems built for operational impact.</h1>
        <p className={styles.intro}>
          A working index of platforms designed to carry real workloads, adapt
          to change, and stay reliable over time.
        </p>
      </header>

      <section aria-label="Systems list">
        <ul className={styles.list}>
          {systems.map((system) => (
            <li key={system.slug} className={styles.item}>
              <Link href={`/systems/${system.slug}`} className={styles.link}>
                <div className={styles.meta}>
                  <span className={styles.status}>{formatStatus(system.status)}</span>
                  <span className={styles.dot} aria-hidden="true">
                    •
                  </span>
                  <span className={styles.year}>{system.year}</span>
                  {system.featured ? (
                    <>
                      <span className={styles.dot} aria-hidden="true">
                        •
                      </span>
                      <span className={styles.featured}>Featured</span>
                    </>
                  ) : null}
                </div>

                <h2
                  className={styles.systemTitle}
                >
                  {system.slug === 'umkm-kit' ? (
                    <>
                      <span title="Brand name is still tentative.">{system.title}</span>
                      *
                    </>
                  ) : (
                    system.title
                  )}
                </h2>
                <p className={styles.summary}>{system.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          Selected systems shown. More production systems will be added.
        </p>
      </section>
    </main>
  )
}
