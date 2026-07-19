import ContentList from '@/components/os/content-list'
import styles from '@/components/os/os-shell.module.css'
import { getContentData } from '@/lib/os-content'

export default async function OsContentPage() {
  const { posts, profiles, targets } = await getContentData()

  return (
    <>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>Agung OS / Content</p>
          <h2 className={styles.pageTitle}>Content</h2>
          <p className={styles.pageDescription}>
            Drafts, scheduled posts, and publishing assets for personal brand and commerce channels.
          </p>
        </div>
      </section>

      <ContentList content={posts} profiles={profiles} targets={targets} />
    </>
  )
}
