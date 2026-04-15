import { notFound } from 'next/navigation'

import { systems } from '@/data/systems'

import styles from './system-detail.module.css'

type SystemDetailContent = {
  problem: string
  solution?: string
  impact?: string
  architecture?: string
  proof?: Array<
    | { type: 'link'; label: string; href: string }
    | { type: 'text'; label: string }
  >
}

const detailContentBySlug: Record<string, SystemDetailContent> = {
  'umkm-kit': {
    problem:
      'Many UMKM workflows are still fragmented - managing catalog, orders, and reporting across separate tools, often manually. Existing solutions tend to be either too generic or misaligned with how businesses actually operate, leading to inconsistent implementations and limited long-term usefulness. The goal is to build a more grounded, plug-and-play system that adapts to specific operational needs - with stronger data structure, clearer system boundaries, and discipline in how workflows evolve over time.',
  },
  'fasih-form-gear': {
    problem:
      'Large survey programs needed configurable form behavior at scale, but manual instrument updates and inconsistent validation rules created quality and rollout risks.',
    solution:
      'Form Gear - FASIH introduced a configuration-driven form engine with central schema controls, branching logic, and reusable validation definitions for survey instruments.',
    impact:
      'Instrument rollout cycles shortened, validation consistency increased across teams, and large-scale data collection became more stable under changing field requirements.',
    architecture:
      'Schema-first form definitions, rule-based validation, and a submission pipeline designed for predictable processing under high-volume survey workloads.',
    proof: [
      {
        type: 'link',
        label: 'Open source: github.com/bps-statistics/form-gear',
        href: 'https://github.com/bps-statistics/form-gear',
      },
      { type: 'text', label: 'Top 3 winner - Solidhack 2022' },
    ],
  },
  'quality-gate-qg': {
    problem:
      'Quality controls across survey and census workflows were inconsistent between teams, creating uneven evaluation quality and slow validation cycles.',
    solution:
      'QG Systems centralized evaluation criteria, validation checkpoints, and evidence tracking into one operational QA flow used by multiple production teams.',
    impact:
      'The platform has been used across dozens of survey and census executions, improving consistency, shortening review loops, and sustaining long-term production usage.',
    architecture:
      'Originally built as a monolithic system, then hardened through production operations to remain stable under repeated high-volume QA workflows.',
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
        <h1
          className={styles.title}
        >
          {system.slug === 'umkm-kit' ? (
            <>
              <span title="Brand name is still tentative.">{system.title}</span>
              *
            </>
          ) : (
            system.title
          )}
        </h1>
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

      {detailContent?.solution ? (
        <section className={styles.block} aria-labelledby="solution">
          <h2 id="solution" className={styles.sectionTitle}>
            Solution
          </h2>
          <p className={styles.body}>{detailContent.solution}</p>
        </section>
      ) : null}

      {detailContent?.proof && detailContent.proof.length > 0 ? (
        <section className={styles.block} aria-labelledby="proof">
          <h2 id="proof" className={styles.sectionTitle}>
            Proof
          </h2>
          <ul>
            {detailContent.proof.map((item) => (
              <li key={item.label} className={styles.body}>
                {item.type === 'link' ? (
                  <a href={item.href} className={styles.ctaLink} target="_blank" rel="noopener noreferrer">
                    {item.label}
                  </a>
                ) : (
                  item.label
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {detailContent?.impact ? (
        <section className={styles.block} aria-labelledby="impact">
          <h2 id="impact" className={styles.sectionTitle}>
            Impact
          </h2>
          <p className={styles.body}>{detailContent.impact}</p>
        </section>
      ) : null}

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
