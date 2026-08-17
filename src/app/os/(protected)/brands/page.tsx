import { connection } from 'next/server'

import BrandsManager from '@/components/os/brands-manager'
import DbUnavailable from '@/components/os/db-unavailable'
import styles from '@/components/os/os-shell.module.css'
import { getBrandsData } from '@/lib/os-brands'

export default async function OsBrandsPage() {
  await connection()

  let data: Awaited<ReturnType<typeof getBrandsData>> | null = null

  try {
    data = await getBrandsData()
  } catch (error) {
    console.error('Failed to load Agung OS brands data', error)
  }

  if (!data) {
    return (
      <>
        <section className={styles.pageHeader}>
          <div>
            <p className={styles.breadcrumb}>Agung OS / Brands</p>
            <h2 className={styles.pageTitle}>Brands</h2>
            <p className={styles.pageDescription}>Dokumentasi hal-hal yang sedang saya handle.</p>
          </div>
        </section>
        <section className={styles.panel}>
          <h3 className={styles.panelTitle}>Brands unavailable</h3>
          <DbUnavailable message="Database connection unavailable. Brands could not be loaded." />
        </section>
      </>
    )
  }

  return <BrandsManager brands={data.brands} />
}
