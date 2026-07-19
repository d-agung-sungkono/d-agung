import AddContentDialog from '@/components/os/add-content-dialog'
import ContentList from '@/components/os/content-list'
import styles from '@/components/os/os-shell.module.css'
import content from '@/data/os/content.json'
import profiles from '@/data/os/profiles.json'

export default function OsContentPage() {
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
        <AddContentDialog profiles={profiles} />
      </section>

      <ContentList content={content} profiles={profiles} />
    </>
  )
}
