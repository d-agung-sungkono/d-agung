import styles from './thinking.module.css'

export default function ThinkingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Thinking</p>
        <h1 className={styles.title}>Writing in progress.</h1>
        <p className={styles.intro}>
          I&apos;ll be sharing thoughts on system design, architecture decisions,
          and lessons from building real systems.
        </p>
      </header>
      <section
        aria-label="Thinking status"
        style={{
          maxWidth: '74ch',
          marginTop: '1.2rem',
          borderTop: '1px solid rgba(17, 17, 17, 0.14)',
          paddingTop: '1.1rem',
        }}
      >
        <p className={styles.meta}>First articles coming soon.</p>
      </section>
    </main>
  )
}
