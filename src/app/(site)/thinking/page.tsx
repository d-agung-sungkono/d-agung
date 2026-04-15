import Link from 'next/link'

import { writings } from '@/data/writings'

import styles from './thinking.module.css'

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value))
}

export default function ThinkingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Thinking</p>
        <h1 className={styles.title}>How systems are designed, tested, and evolved in the real world.</h1>
        <p className={styles.intro}>
          Writing focused on architecture decisions, tradeoffs under constraints,
          and practical system thinking beyond theory.
        </p>
      </header>

      <section aria-label="Thinking articles">
        <ul className={styles.list}>
          {writings.map((writing) => (
            <li key={writing.slug} className={styles.item}>
              <Link href={`/thinking/${writing.slug}`} className={styles.link}>
                <p className={styles.meta}>{formatDate(writing.publishedAt)}</p>
                <h2 className={styles.itemTitle}>{writing.title}</h2>
                <p className={styles.excerpt}>{writing.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
