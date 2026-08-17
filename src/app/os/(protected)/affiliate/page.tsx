import { connection } from 'next/server'

import AffiliateProductsManager from '@/components/os/affiliate-products-manager'
import DbUnavailable from '@/components/os/db-unavailable'
import styles from '@/components/os/os-shell.module.css'
import { getOsAffiliateProducts } from '@/lib/os-affiliate-products'

export default async function OsAffiliatePage() {
  await connection()

  let products: Awaited<ReturnType<typeof getOsAffiliateProducts>> | null = null

  try {
    products = await getOsAffiliateProducts()
  } catch (error) {
    console.error('Failed to load Agung OS affiliate products data', error)
  }

  if (!products) {
    return (
      <>
        <section className={styles.pageHeader}>
          <div>
            <p className={styles.breadcrumb}>Agung OS / Affiliate</p>
            <h2 className={styles.pageTitle}>Affiliate</h2>
            <p className={styles.pageDescription}>CMS untuk produk yang tampil di halaman publik /affiliate.</p>
          </div>
        </section>
        <section className={styles.panel}>
          <h3 className={styles.panelTitle}>Affiliate CMS unavailable</h3>
          <DbUnavailable message="Database connection unavailable. Affiliate products could not be loaded." />
        </section>
      </>
    )
  }

  return <AffiliateProductsManager products={products} />
}
