import { notFound } from 'next/navigation'

import { writings } from '@/data/writings'

import styles from '../thinking.module.css'

type ThinkingBody = {
  overview: string
  sections: Array<{
    heading: string
    emphasis?: string
    paragraphs: string[]
  }>
}

const bodyBySlug: Record<string, ThinkingBody> = {
  'why-systems-fail-before-they-scale': {
    overview:
      'Most system failures appear long before scale arrives. The first warning signs are usually architectural shortcuts that speed up delivery now but remove predictability later.',
    sections: [
      {
        heading: 'Process Boundaries',
        emphasis: 'Failure often starts at handoffs, not at traffic peaks.',
        paragraphs: [
          'When ownership between modules is unclear, changes move fast only in isolated teams.',
          'Once features cross domain boundaries, coordination cost rises and release confidence drops.',
        ],
      },
      {
        heading: 'Operational Pressure',
        paragraphs: [
          'Throughput growth exposes weak assumptions in validation, retries, and state transitions.',
          'Systems that look stable in small environments become fragile under routine production traffic.',
        ],
      },
      {
        heading: 'Decision Discipline',
        paragraphs: [
          'Sustainable scale is less about rewriting everything and more about preserving explicit interfaces.',
          'Observability and clear evolution paths need to exist from early stages, not after incidents.',
        ],
      },
    ],
  },
  'modular-business-engine-principles': {
    overview:
      'A modular business engine is built by separating capabilities that change at different speeds. The goal is to let teams evolve pricing, workflows, and integrations without disrupting the operational core.',
    sections: [
      {
        heading: 'Capability Modeling',
        emphasis: 'Model the business, not the interface.',
        paragraphs: [
          'Systems remain adaptable when architecture follows business capabilities rather than UI structure.',
          'This prevents product redesigns from forcing deep platform rewrites.',
        ],
      },
      {
        heading: 'Stable Contracts',
        paragraphs: [
          'Core modules should expose explicit contracts for data and transitions.',
          'This keeps surrounding modules flexible while preserving integrity of central business logic.',
        ],
      },
      {
        heading: 'Constrained Evolution',
        paragraphs: [
          'Good modularity anticipates partial migration, staggered rollout, and mixed legacy states.',
          'Evolution strategy is part of architecture, not a post-implementation fix.',
        ],
      },
    ],
  },
  'separating-logic-from-interface': {
    overview:
      'Systems become maintainable when core rules are independent from interface choices. Interface layers should orchestrate user flow, while domain logic remains stable and testable.',
    sections: [
      {
        heading: 'Interface Boundaries',
        emphasis: 'Interface should deliver behavior, not define it.',
        paragraphs: [
          'When business rules live inside interface components, product changes create hidden regressions.',
          'Domain services should define behavior so interfaces can iterate safely.',
        ],
      },
      {
        heading: 'Shared Logic',
        paragraphs: [
          'Cross-platform consistency depends on shared decision logic, not duplicated component behavior.',
          'Explicit domain APIs reduce drift across web, mobile, and internal tooling.',
        ],
      },
      {
        heading: 'Independent Testing',
        paragraphs: [
          'Decoupled logic enables direct tests for rules and state transitions without UI setup overhead.',
          'This shortens feedback loops and improves release reliability.',
        ],
      },
    ],
  },
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value))
}

function estimateReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(words / 220))
  return `${minutes} min read`
}

export default async function ThinkingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const writing = writings.find((item) => item.slug === slug)

  if (!writing) {
    notFound()
  }

  const body = bodyBySlug[writing.slug]

  if (!body) {
    notFound()
  }

  const readingTime = estimateReadingTime(
    [
      body.overview,
      ...body.sections.flatMap((section) => [
        section.heading,
        section.emphasis ?? '',
        ...section.paragraphs,
      ]),
    ].join(' ')
  )

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Thinking</p>
        <h1 className={styles.title}>{writing.title}</h1>
        <div className={styles.metaRow}>
          <span>{formatDate(writing.publishedAt)}</span>
          <span className={styles.metaDot} aria-hidden="true">
            •
          </span>
          <span>{readingTime}</span>
        </div>
      </header>

      <article className={styles.article}>
        <p className={styles.lead}>{body.overview}</p>
        {body.sections.map((section) => (
          <section key={section.heading} className={styles.articleSection}>
            <h2 className={styles.sectionTitle}>{section.heading}</h2>
            {section.emphasis ? (
              <p className={styles.emphasis}>{section.emphasis}</p>
            ) : null}
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </main>
  )
}
