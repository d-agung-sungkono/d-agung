'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import type { SystemItem } from '@/types/system'

import styles from './Hero.module.css'

type HeroProps = {
  featuredSystem: SystemItem | null
  selectedSystem: SystemItem | null
  upcomingSystems: SystemItem[]
}

type RailItem = {
  label: string
  sublabel: string
  href: string
  isActive?: boolean
}

type CarouselSlide = {
  id: string
  title: string
  system: SystemItem | null
  variant?: 'default' | 'currentBuild' | 'selected' | 'upcoming'
}

const railItems: RailItem[] = [
  { label: 'ACTIVE', sublabel: 'Current Focus', href: '/', isActive: true },
  { label: 'SYSTEMS', sublabel: 'Built Platforms', href: '/systems' },
  { label: 'THINKING', sublabel: 'Architecture Notes', href: '/thinking' },
  { label: 'PROOF', sublabel: 'Execution Artifacts', href: '/proof' },
  { label: 'OFF CODE', sublabel: 'Outside Engineering', href: '/off-code' },
]

function getStageText(system: SystemItem): string {
  if (system.status === 'running') return 'launching'
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
  variant?: 'default' | 'currentBuild' | 'selected' | 'upcoming'
}) {
  const isCurrentBuild = variant === 'currentBuild'
  const isSelected = variant === 'selected'
  const isUpcoming = variant === 'upcoming'
  const hasProductUrl = Boolean(system?.productUrl)
  const isExternalUrl = /^https?:\/\//.test(system?.productUrl ?? '')

  return (
    <article
      className={`${styles.systemSection} ${isCurrentBuild ? styles.currentBuildCard : ''} ${isSelected ? styles.selectedCard : ''} ${isUpcoming ? styles.upcomingCard : ''}`}
      aria-label={title}
    >
      <h2 className={styles.sectionTitle}>{title}</h2>
      {system ? (
        <>
          <h3 className={styles.systemTitle}>
            <Link href={`/systems/${system.slug}`}>{system.title}</Link>
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
          {hasProductUrl ? (
            <p className={styles.systemCtaWrap}>
              <a
                href={system.productUrl}
                className={styles.systemCta}
                target={isExternalUrl ? '_blank' : undefined}
                rel={isExternalUrl ? 'noopener noreferrer' : undefined}
              >
                {system.productLabel ?? 'Visit Product'} <span aria-hidden="true">↗</span>
              </a>
            </p>
          ) : null}
        </>
      ) : (
        <p className={styles.emptyState}>No system selected.</p>
      )}
    </article>
  )
}

export default function Hero({
  featuredSystem,
  selectedSystem,
  upcomingSystems,
}: HeroProps) {
  const [slideIndex, setSlideIndex] = useState(0)

  const slides: CarouselSlide[] = useMemo(
    () => {
      const seen = new Set<string>()
      const results: CarouselSlide[] = []
      const addSlide = (
        title: string,
        system: SystemItem | null,
        variant?: 'default' | 'currentBuild'
      ) => {
        if (!system) return
        if (seen.has(system.slug)) return
        seen.add(system.slug)
        results.push({
          id: `${title.toLowerCase().replace(/\s+/g, '-')}-${system.slug}`,
          title,
          system,
          variant,
        })
      }

      addSlide('Current Build', featuredSystem, 'currentBuild')
      addSlide('Selected System', selectedSystem, 'selected')
      upcomingSystems.forEach((system) => addSlide('Upcoming', system, 'upcoming'))
      return results
    },
    [featuredSystem, selectedSystem, upcomingSystems]
  )

  useEffect(() => {
    if (slides.length <= 1) return
    const interval = window.setInterval(() => {
      setSlideIndex((index) => (index + 1) % slides.length)
    }, 5200)

    return () => window.clearInterval(interval)
  }, [slides.length])

  const safeSlideIndex = slides.length ? slideIndex % slides.length : 0
  const activeSlide = slides.length ? slides[safeSlideIndex] : null
  const onPrevSlide = () =>
    setSlideIndex((index) => (index - 1 + slides.length) % slides.length)
  const onNextSlide = () => setSlideIndex((index) => (index + 1) % slides.length)

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

        <section className={styles.carouselSection} aria-label="System Highlights">
          {activeSlide ? (
            <>
              <SystemSummary
                title={activeSlide.title}
                system={activeSlide.system}
                variant={activeSlide.variant}
              />
              <div className={styles.carouselControls}>
                {slides.length > 1 ? (
                  <button
                    type="button"
                    className={styles.carouselNavButton}
                    onClick={onPrevSlide}
                    aria-label="Previous project"
                  >
                    Prev
                  </button>
                ) : null}
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={`${styles.carouselDot} ${index === safeSlideIndex ? styles.carouselDotActive : ''}`}
                    onClick={() => setSlideIndex(index)}
                    aria-label={`Show ${slide.title} ${slide.system?.title ?? ''}`}
                    aria-pressed={index === safeSlideIndex}
                  />
                ))}
                {slides.length > 1 ? (
                  <button
                    type="button"
                    className={styles.carouselNavButton}
                    onClick={onNextSlide}
                    aria-label="Next project"
                  >
                    Next
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <p className={styles.emptyState}>No project data available.</p>
          )}
        </section>
      </div>

      <figure className={styles.centerColumn} aria-label="Featured portrait">
        <div className={styles.portraitMedia}>
          <Image
            src="/agung-portrait.jpg"
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
