import styles from '@/components/os/os-shell.module.css'

export default function OsProtectedLoading() {
  return (
    <div className={styles.loadingPage} aria-hidden="true">
      <section className={styles.welcome}>
        <div className={styles.loadingHeaderCopy}>
          <span className={`${styles.skeletonBlock} ${styles.loadingEyebrow}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingTitle}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingBody}`} />
        </div>
        <span className={`${styles.skeletonBlock} ${styles.loadingClock}`} />
      </section>

      <section className={styles.loadingSummaryGrid}>
        {Array.from({ length: 4 }, (_, index) => (
          <div className={styles.summaryCard} key={index}>
            <span className={`${styles.skeletonBlock} ${styles.loadingCardLabel}`} />
            <span className={`${styles.skeletonBlock} ${styles.loadingCardValue}`} />
            <span className={`${styles.skeletonBlock} ${styles.loadingCardHint}`} />
          </div>
        ))}
      </section>

      <section className={styles.loadingPanelStack}>
        <div className={`${styles.panel} ${styles.loadingPanelTall}`}>
          <span className={`${styles.skeletonBlock} ${styles.loadingPanelHeading}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingListItem}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingListItem}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingListItemShort}`} />
        </div>
        <div className={`${styles.panel} ${styles.loadingPanelShort}`}>
          <span className={`${styles.skeletonBlock} ${styles.loadingPanelHeading}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingAction}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingAction}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingActionShort}`} />
        </div>
      </section>
    </div>
  )
}
