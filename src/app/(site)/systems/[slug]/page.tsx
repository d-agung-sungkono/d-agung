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
      'There are two recurring friction points in UMKM operations. First, when too many features are introduced at once and paid from day one, teams often feel overwhelmed and end up paying for capabilities they do not actually use. Second, when businesses start from traditional or separated workflows, migration becomes heavy: catalog, orders, and reporting stay fragmented across chat, spreadsheets, and manual notes.',
    solution:
      'WarungKit is designed to grow with the user. It starts from a focused core, then expands progressively through modules that can be adopted step by step, so teams can move from traditional workflows without operational shock or feature overload.',
    architecture:
      'WarungKit is currently built as a monolithic fullstack application on Next.js, with Supabase as the primary database layer. This is the foundation: a stable base to move fast during launch, while keeping a clear path toward modular boundaries as usage deepens across different UMKM contexts.',
    impact:
      'From this foundation, rollout will continue in practical increments: keep shipping useful modules, grow with real user behavior, and sustain long-term fit for daily UMKM operations.',
  },
  wriday: {
    problem:
      'Writing in English can feel heavier than it should, especially for learners preparing for IELTS and academic writing formats. The ideas are there, but drafting speed, structure anxiety, and unclear feedback often turn practice into friction.',
    solution:
      'Wriday starts as a mini SaaS companion to make writing sessions feel lighter: focused prompts, rewrite support, and short iteration loops that keep momentum without making practice feel like a chore.',
    impact:
      'Still in idea stage, but the direction is clear: a practical writing layer people can return to often, where consistency beats pressure.',
    architecture:
      'Built as a compact surface first, then expanded into modular writing utilities as real usage patterns emerge.',
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
  laviumhub: {
    problem:
      'Small laundry businesses often rely on manual updates for customer information, machine availability, and delivery estimates. This creates slow response time and inconsistent service communication.',
    solution:
      'LaviumHub provides a practical UMKM landing page where customers can see available service types, check whether machines are currently in use, and estimate delivery pricing in one flow.',
    impact:
      'The platform gives the owner team a clearer operational touchpoint with customers, reducing repetitive manual explanations and improving service transparency.',
    architecture:
      'A focused, lightweight web experience designed around core operational widgets: service catalog, machine occupancy status, and delivery cost estimator.',
  },
}

function formatStatus(status: string): string {
  if (status.trim() === 'running') return 'launching'
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
