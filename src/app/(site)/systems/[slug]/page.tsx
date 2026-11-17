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
  warungkit: {
    problem:
      'Independent businesses often have to stitch together a public website, contacts, orders, projects, invoices, files, and reminders across separate tools. Generic website builders solve the page, but not the business workflow behind it; operational tools solve the workflow, but rarely produce a public presence that feels ready to sell.',
    solution:
      'WarungKit is moving toward opinionated vertical products: a polished website in front, a business workspace behind it, and automation that removes repeated follow-up work. The immediate focus is a website engine that feels like filling in a business, not learning a builder, then adapting that engine for freelancers, creators, preorder sellers, affiliates, and other specific business types.',
    architecture:
      'The product direction is website first, management workflow second, automation third. Payments can stay external at the start through QRIS, bank transfer, or payment links, while AI is treated as a later advantage only when it improves a concrete workflow. The reusable core should emerge from repeated needs across real verticals.',
    impact:
      'The commercial direction is to sell clear outcomes from day one instead of staying in endless validation mode: publish the offer, show the price, collect waitlist or email demand while products are prepared, then refine from real customer usage and feedback.',
  },
  'query-flow': {
    problem:
      'Apache Superset provides a flexible SQL workspace, but recurring organizational workflows often need a more opinionated execution flow. In the current FASIH SQL Lab context, collections of SQL files must follow BPS business processes, handle large and potentially interrupted results, and produce consistently organized Excel outputs.',
    solution:
      'QueryFlow is an open-source Chrome extension designed as a companion for Apache Superset. Its current development is focused on FASIH SQL Lab: importing folders of SQL files, running selected queries individually or sequentially, applying region parameters, and exporting results according to BPS operational needs. Large results can be downloaded in checkpoints or split into separate workbooks using one or two result columns.',
    impact:
      'The project turns recurring SQL work into a more repeatable flow while keeping the operator in control of the active Superset session. FASIH and BPS workflows are the present implementation focus, while the open-source direction leaves room for adaptation to other Apache Superset environments. Collaboration is open through testing, issue reports, workflow proposals, and focused code contributions.',
    architecture:
      'Built with TypeScript, React, and Vite as a Chrome side-panel extension that works alongside Apache Superset. SQL source files remain unchanged, imported snapshots stay local in the browser, and queries run through the user\'s existing authenticated SQL Lab session without collecting login credentials. FASIH-specific behavior is developed around the business processes currently used at BPS.',
    proof: [
      {
        type: 'link',
        label: 'Source, documentation, and contributions on GitHub',
        href: 'https://github.com/d-agung-sungkono/query-flow',
      },
    ],
  },
  wriday: {
    problem:
      'Wriday is still in a confusing exploration stage. The writing-practice space already has many products that help with prompts, rewriting, feedback, and learning loops, so the main question is whether this idea has a specific angle that is actually different enough.',
    solution:
      'The current direction is not fixed yet. It may become a small writing companion, but the next step is to understand what should make it uniquely useful instead of becoming another generic writing tool.',
    impact:
      'Still in idea stage. The value is intentionally being questioned first, especially around uniqueness, before deciding whether it deserves to become a real product.',
    architecture:
      'No firm architecture yet. The technical shape should follow the validated product angle, not the other way around.',
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
      'LaviumHub is no longer just a small laundry presence that needs a simple information page. As the business becomes more serious and expands into multiple services, the brand needs a stronger public layer that can make customers understand the offer, trust the service, and see the business as more established.',
    solution:
      'The website is positioned as an important branding asset: a polished home for the business, its service lines, operating information, and customer-facing touchpoints. It should make LaviumHub feel clearer, more credible, and ready to grow beyond a single laundry workflow.',
    impact:
      'For the business, the site becomes a serious trust signal. It supports scale by giving every service a clearer place to be explained, making customer communication more consistent, and helping the brand look as mature as the direction it is moving toward.',
    architecture:
      'A lightweight web foundation that can keep growing with the business: brand pages, service sections, customer contact flows, and practical operational widgets can be expanded without losing the core brand presentation.',
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
          {system.openForCollaboration ? (
            <>
              <span className={styles.dot} aria-hidden="true">
                •
              </span>
              <span className={styles.status}>Open for collaboration</span>
            </>
          ) : null}
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
