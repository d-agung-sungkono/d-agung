import styles from '@/components/os/os-shell.module.css'

export default function OsBrandDetailLoading() {
  return (
    <div className={styles.loadingPage} aria-hidden="true">
      <section className={styles.pageHeader}>
        <div className={styles.loadingHeaderCopy}>
          <span className={`${styles.skeletonBlock} ${styles.loadingEyebrow}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingTitle}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingBody}`} />
        </div>
      </section>

      <section className={styles.brandHeroLoading}>
        <span className={`${styles.skeletonBlock} ${styles.brandHeroLoadingImage}`} />
        <div className={styles.brandHeroLoadingBody}>
          <span className={`${styles.skeletonBlock} ${styles.loadingTitle}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingBody}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingBody}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingAction}`} />
        </div>
      </section>

      <section className={styles.brandDetailLoadingGrid}>
        {Array.from({ length: 4 }, (_, index) => (
          <div className={`${styles.panel} ${styles.loadingPanelTall}`} key={index}>
            <span className={`${styles.skeletonBlock} ${styles.loadingPanelHeading}`} />
            <span className={`${styles.skeletonBlock} ${styles.loadingListItem}`} />
            <span className={`${styles.skeletonBlock} ${styles.loadingListItem}`} />
            <span className={`${styles.skeletonBlock} ${styles.loadingListItemShort}`} />
          </div>
        ))}
      </section>
    </div>
  )
}
