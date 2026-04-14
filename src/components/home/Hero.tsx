import type { SystemItem } from '@/types/system'

import styles from './Hero.module.css'

type HeroProps = {
  featuredSystem: SystemItem | null
  selectedSystem: SystemItem | null
}

type RailItem = {
  label: string
  sublabel: string
  href: string
}

const railItems: RailItem[] = [
  { label: 'ACTIVE', sublabel: 'Current Focus', href: '/' },
  { label: 'SYSTEMS', sublabel: 'Built Platforms', href: '/systems' },
  { label: 'THINKING', sublabel: 'Architecture Notes', href: '/thinking' },
  { label: 'PROOF', sublabel: 'Execution Artifacts', href: '/proof' },
  { label: 'OFF CODE', sublabel: 'Outside Engineering', href: '/off-code' },
]

function SystemSummary({
  title,
  system,
}: {
  title: string
  system: SystemItem | null
}) {
  return (
    <section className={styles.systemSection} aria-label={title}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {system ? (
        <article>
          <h3 className={styles.systemTitle}>{system.title}</h3>
          <p className={styles.systemMeta}>
            {system.status} · {system.year}
          </p>
          <p className={styles.systemSummary}>{system.summary}</p>
        </article>
      ) : (
        <p className={styles.emptyState}>No system selected.</p>
      )}
    </section>
  )
}

export default function Hero({ featuredSystem, selectedSystem }: HeroProps) {
  return (
    <section className={styles.hero} aria-label="Homepage hero">
      <div className={styles.leftColumn}>
        <header className={styles.intro}>
          <p className={styles.identity}>D. Agung Sungkono</p>
          <p className={styles.role}>Software Engineer</p>
          <h1 className={styles.headline}>
            <span>Building systems</span>
            <span>that scale</span>
            <span>beyond day one.</span>
          </h1>
          <p className={styles.supportingText}>
            Designing modular products and architecture that remain adaptable
            under real operational pressure.
          </p>
        </header>

        <SystemSummary title="Current Build" system={featuredSystem} />
        <SystemSummary title="Selected System" system={selectedSystem} />
      </div>

      <figure className={styles.centerColumn} aria-label="Featured visual placeholder">
        <div className={styles.portraitPlaceholder}>Portrait Placeholder</div>
      </figure>

      <aside className={styles.rightColumn}>
        <nav aria-label="Primary">
          <ul className={styles.railList}>
            {railItems.map((item) => (
              <li key={item.label} className={styles.railItem}>
                <a href={item.href} className={styles.railLink}>
                  <span className={styles.railLabel}>{item.label}</span>
                  <span className={styles.railSubLabel}>{item.sublabel}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </section>
  )
}
