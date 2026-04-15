import styles from '../thinking/thinking.module.css'

export default function OffCodePage() {
  return (
    <main className={styles.page}>
      <section
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
        }}
        aria-labelledby="off-code-title"
      >
        <div
          style={{
            width: '100%',
            maxWidth: '74ch',
            borderTop: '1px solid rgba(17, 17, 17, 0.14)',
            paddingTop: 'clamp(1.3rem, 3vw, 2rem)',
          }}
        >
          <p className={styles.kicker}>Off Code</p>
          <h1 id="off-code-title" className={styles.title}>
            Outside engineering, coming soon.
          </h1>
          <p className={styles.intro}>
            This space will share things beyond systems - experiments,
            interests, and ideas in progress.
          </p>
          <p
            className={styles.meta}
            style={{ marginTop: '1.2rem', letterSpacing: '0.13em' }}
          >
            Check back later
          </p>
        </div>
      </section>
    </main>
  )
}
