import styles from '@/components/os/os-shell.module.css'

export default function OsBrandsLoading() {
  return (
    <div className={styles.loadingPage} aria-hidden="true">
      <section className={styles.pageHeader}>
        <div className={styles.loadingHeaderCopy}>
          <span className={`${styles.skeletonBlock} ${styles.loadingEyebrow}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingTitle}`} />
          <span className={`${styles.skeletonBlock} ${styles.loadingBody}`} />
        </div>
        <span className={`${styles.skeletonBlock} ${styles.loadingAction}`} />
      </section>

      <section className={styles.brandGridLoading}>
        {Array.from({ length: 6 }, (_, index) => (
          <div className={styles.brandCardLoading} key={index}>
            <span className={`${styles.skeletonBlock} ${styles.brandCardLoadingImage}`} />
            <span className={`${styles.skeletonBlock} ${styles.loadingPanelHeading}`} />
            <span className={`${styles.skeletonBlock} ${styles.loadingListItem}`} />
            <span className={`${styles.skeletonBlock} ${styles.loadingListItemShort}`} />
            <span className={`${styles.skeletonBlock} ${styles.loadingActionShort}`} />
          </div>
        ))}
      </section>
    </div>
  )
}
