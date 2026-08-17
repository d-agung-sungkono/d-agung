import DbUnavailable from '@/components/os/db-unavailable'
import styles from '@/components/os/os-shell.module.css'
import ProfilesSettings from '@/components/os/profiles-settings'
import { getSettingsData } from '@/lib/os-settings'
import { connection } from 'next/server'

type OsSocmedsPageProps = {
  searchParams: Promise<{ brand?: string }>
}

export default async function OsSocmedsPage({ searchParams }: OsSocmedsPageProps) {
  await connection()
  const { brand } = await searchParams

  let settingsData: Awaited<ReturnType<typeof getSettingsData>> | null = null

  try {
    settingsData = await getSettingsData()
  } catch (error) {
    console.error('Failed to load Agung OS social media data', error)
  }

  if (!settingsData) {
    return (
      <>
        <section className={styles.pageHeader}>
          <div>
            <p className={styles.breadcrumb}>Agung OS / Social Media</p>
            <h2 className={styles.pageTitle}>Social Media</h2>
            <p className={styles.pageDescription}>
              Platform accounts used to map content, publishing targets, and future embeds.
            </p>
          </div>
        </section>
        <section className={styles.panel}>
          <h3 className={styles.panelTitle}>Social accounts unavailable</h3>
          <DbUnavailable message="Database connection unavailable. Social media accounts could not be loaded." />
        </section>
      </>
    )
  }

  return <ProfilesSettings {...settingsData} initialBrandId={brand} />
}
