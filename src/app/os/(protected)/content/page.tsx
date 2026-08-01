import DbUnavailable from '@/components/os/db-unavailable'
import ContentList from '@/components/os/content-list'
import styles from '@/components/os/os-shell.module.css'
import { getContentData } from '@/lib/os-content'

export default async function OsContentPage() {
  let contentData: Awaited<ReturnType<typeof getContentData>> | null = null

  try {
    contentData = await getContentData()
  } catch (error) {
    console.error('Failed to load Agung OS contents data', error)
  }

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

      {contentData ? (
        <ContentList content={contentData.posts} profiles={contentData.profiles} targets={contentData.targets} />
      ) : (
        <section className={styles.panel}>
          <h3 className={styles.panelTitle}>Contents unavailable</h3>
          <DbUnavailable message="Database connection unavailable. Contents, targets, and account mappings could not be loaded." />
        </section>
      )}
    </>
  )
}
