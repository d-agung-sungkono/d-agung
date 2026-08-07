import DbUnavailable from '@/components/os/db-unavailable'
import ProductsProfitModal from '@/components/os/products-profit-modal'
import ProductsTable from '@/components/os/products-table'
import styles from '@/components/os/os-shell.module.css'
import { getProductsData } from '@/lib/os-products'
import { connection } from 'next/server'

export default async function OsProductsPage() {
  await connection()

  let productsData: Awaited<ReturnType<typeof getProductsData>> = { products: [], snapshots: [] }
  let dbError = false

  try {
    productsData = await getProductsData()
  } catch (error) {
    dbError = true
    console.error('Failed to load Agung OS products data', error)
  }

  return (
    <>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>Agung OS / Products</p>
          <h2 className={styles.pageTitle}>Products</h2>
          <p className={styles.pageDescription}>
            Product watchlist for commerce experiments, price changes, and stock signals.
          </p>
        </div>
        <ProductsProfitModal />
      </section>
      {dbError ? <DbUnavailable message="Database connection unavailable. Products could not be loaded." /> : null}

      <ProductsTable products={productsData.products} snapshots={productsData.snapshots} />
    </>
  )
}
