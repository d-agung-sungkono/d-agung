import ContentList from '@/components/os/content-list'
import styles from '@/components/os/os-shell.module.css'
import { getContentData } from '@/lib/os-content'

export default async function OsContentPage() {
  const { posts, profiles, targets } = await getContentData()

  return (
    <>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>Agung OS / Contents</p>
          <h2 className={styles.pageTitle}>Contents</h2>
          <p className={styles.pageDescription}>
            Drafts, scheduled posts, and publishing assets for personal brand and commerce channels.
          </p>
        </div>
      </section>

      <ContentList content={posts} profiles={profiles} targets={targets} />
    </>
  )
}
