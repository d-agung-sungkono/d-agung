import Image from 'next/image'
import { notFound } from 'next/navigation'

import { systems } from '@/data/systems'

import styles from './system-detail.module.css'

type SystemDetailContent = {
  problem: string
  solution: string
  impact: string
  architecture?: string
}

const detailContentBySlug: Record<string, SystemDetailContent> = {
  warungkit: {
    problem:
      'UMKM operations were fragmented across chat, spreadsheets, and disconnected tools, causing delays in fulfillment, unclear stock positions, and low confidence in daily decisions.',
    solution:
      'WarungKit was structured as a modular business engine: shared core entities for catalog and orders, clear process boundaries, and lightweight reporting designed for teams with limited operational overhead.',
    impact:
      'Daily workflows became more predictable, order processing moved faster, and operational visibility improved through one consistent source of truth across core business activities.',
    architecture:
      'Modular domain boundaries with explicit data flow between catalog, ordering, and reporting modules. This keeps features evolvable without forcing full rewrites.',
  },
  'fasih-form-gear': {
    problem:
      'Large survey programs needed configurable form behavior at scale, but manual instrument updates and inconsistent validation rules created quality and rollout risks.',
    solution:
      'Fasih Form Gear introduced a configuration-driven form engine with central schema controls, branching logic, and reusable validation definitions for survey instruments.',
    impact:
      'Instrument rollout cycles shortened, validation consistency increased across teams, and large-scale data collection became more stable under changing field requirements.',
    architecture:
      'Schema-first form definitions, rule-based validation, and a submission pipeline designed for predictable processing under high-volume survey workloads.',
  },
  sadewa: {
    problem:
      'Quality assurance assessments were hard to standardize, with scoring rules interpreted differently and supporting evidence scattered across teams.',
    solution:
      'Sadewa centralized self-assessment workflows with structured scoring criteria, guided evaluation steps, and evidence-linked records for auditability.',
    impact:
      'Assessment quality became more consistent, review cycles were easier to coordinate, and teams gained clearer visibility into quality gaps and follow-up priorities.',
    architecture:
      'Structured scoring model, evidence attachment flow, and review-state transitions designed to preserve traceability from input through final assessment output.',
  },
}

function formatStatus(status: string): string {
  return status.trim().replace('-', ' ')
}

export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const system = systems.find((item) => item.slug === slug)

  if (!system) {
    notFound()
  }

  const detailContent = detailContentBySlug[system.slug]
  const ctaLabel = system.productLabel ?? 'Visit Product'
  const hasProductUrl = Boolean(system.productUrl)
  const isExternalUrl = /^https?:\/\//.test(system.productUrl ?? '')

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>System</p>
        <h1 className={styles.title}>{system.title}</h1>
        <div className={styles.meta}>
          <span className={styles.status}>{formatStatus(system.status)}</span>
          <span className={styles.dot} aria-hidden="true">
            •
          </span>
          <span className={styles.year}>{system.year}</span>
        </div>
      </header>

      <section className={styles.block} aria-labelledby="intro">
        <h2 id="intro" className={styles.sectionTitle}>
          Intro
        </h2>
        <p className={styles.body}>{system.summary}</p>
        {hasProductUrl ? (
          <p className={styles.ctaWrap}>
            <a
              href={system.productUrl}
              className={styles.ctaLink}
              target={isExternalUrl ? '_blank' : undefined}
              rel={isExternalUrl ? 'noopener noreferrer' : undefined}
            >
              {ctaLabel}
            </a>
          </p>
        ) : null}
      </section>

      <section className={styles.block} aria-labelledby="problem">
        <h2 id="problem" className={styles.sectionTitle}>
          Problem
        </h2>
        <p className={styles.body}>{detailContent?.problem}</p>
      </section>

      <section className={styles.block} aria-labelledby="solution">
        <h2 id="solution" className={styles.sectionTitle}>
          Solution
        </h2>
        <p className={styles.body}>{detailContent?.solution}</p>
      </section>

      {system.images && system.images.length > 0 ? (
        <section className={styles.block} aria-labelledby="showcase">
          <h2 id="showcase" className={styles.sectionTitle}>
            Showcase
          </h2>
          <div className={styles.showcaseList}>
            {system.images.map((image) => (
              <figure key={image.src} className={styles.showcaseFigure}>
                <div className={styles.showcaseMedia}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className={styles.showcaseImage}
                    sizes="(max-width: 760px) 100vw, 980px"
                  />
                </div>
                {image.caption ? (
                  <figcaption className={styles.caption}>{image.caption}</figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.block} aria-labelledby="impact">
        <h2 id="impact" className={styles.sectionTitle}>
          Impact
        </h2>
        <p className={styles.body}>{detailContent?.impact}</p>
      </section>

      {detailContent?.architecture ? (
        <section className={styles.block} aria-labelledby="architecture">
          <h2 id="architecture" className={styles.sectionTitle}>
            Tech / Architecture
          </h2>
          <p className={styles.body}>{detailContent.architecture}</p>
        </section>
      ) : null}
    </main>
  )
}
