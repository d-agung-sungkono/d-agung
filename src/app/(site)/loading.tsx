import styles from './site-loading.module.css'

export default function SiteLoading() {
  return (
    <main className={styles.shell} aria-hidden="true">
      <section className={styles.hero}>
        <div className={styles.column}>
          <span className={`${styles.skeleton} ${styles.eyebrow}`} />
          <span className={`${styles.skeleton} ${styles.headline}`} />
          <span className={`${styles.skeleton} ${styles.bodyWide}`} />
          <span className={`${styles.skeleton} ${styles.body}`} />
          <span className={`${styles.skeleton} ${styles.cardTitle}`} />
          <span className={`${styles.skeleton} ${styles.cardBody}`} />
        </div>

        <div className={styles.portrait}>
          <span className={`${styles.skeleton} ${styles.portraitFill}`} />
        </div>

        <div className={styles.rail}>
          {Array.from({ length: 5 }, (_, index) => (
            <span className={`${styles.skeleton} ${styles.railItem}`} key={index} />
          ))}
        </div>
      </section>
    </main>
  )
}
