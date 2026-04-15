import Image from 'next/image'

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
  isActive?: boolean
}

const railItems: RailItem[] = [
  { label: 'ACTIVE', sublabel: 'Current Focus', href: '/', isActive: true },
  { label: 'SYSTEMS', sublabel: 'Built Platforms', href: '/systems' },
  { label: 'THINKING', sublabel: 'Architecture Notes', href: '/thinking' },
  { label: 'PROOF', sublabel: 'Execution Artifacts', href: '/proof' },
  { label: 'OFF CODE', sublabel: 'Outside Engineering', href: '/off-code' },
]

function getStageText(system: SystemItem): string {
  if (system.status === 'running') return 'active use'
  if (system.status === 'done') return 'stable release'
  if (system.status === 'in-progress') return 'pre-mvp'
  return 'early exploration'
}

function SystemSummary({
  title,
  system,
  variant = 'default',
}: {
  title: string
  system: SystemItem | null
  variant?: 'default' | 'currentBuild'
}) {
  const isCurrentBuild = variant === 'currentBuild'

  return (
    <section
      className={`${styles.systemSection} ${isCurrentBuild ? styles.currentBuildCard : ''}`}
      aria-label={title}
    >
      <h2 className={styles.sectionTitle}>{title}</h2>
      {system ? (
        <article>
          <h3
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
          </h3>
          {isCurrentBuild ? (
            <p className={styles.systemMeta}>
              <span className={styles.statusIndicator} aria-hidden="true" />
              <span>{system.status}</span>
              <span className={styles.metaDivider}>·</span>
              <span>{system.year}</span>
              <span className={styles.metaDivider}>·</span>
              <span className={styles.versionText}>{getStageText(system)}</span>
            </p>
          ) : (
            <p className={styles.systemMeta}>
              {system.status} · {system.year}
            </p>
          )}
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
          <p className={styles.identity}>D.Agung Sungkono</p>
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

        <SystemSummary
          title="Current Build"
          system={featuredSystem}
          variant="currentBuild"
        />
        <SystemSummary title="Selected System" system={selectedSystem} />
      </div>

      <figure className={styles.centerColumn} aria-label="Featured portrait">
        <div className={styles.portraitMedia}>
          <Image
            src="/agung-profesional.png"
            alt="Portrait editorial placeholder"
            fill
            unoptimized
            priority
            className={styles.portraitImage}
            sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 35vw"
          />
        </div>
      </figure>

      <aside className={styles.rightColumn}>
        <nav className={styles.railNav} aria-label="Primary">
          <ul className={styles.railList}>
            {railItems.map((item) => (
              <li
                key={item.label}
                className={`${styles.railItem} ${item.isActive ? styles.railItemActive : ''}`}
              >
                <a
                  href={item.href}
                  className={`${styles.railLink} ${item.isActive ? styles.railLinkActive : ''}`}
                  aria-current={item.isActive ? 'page' : undefined}
                >
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
