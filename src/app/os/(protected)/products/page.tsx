import DbUnavailable from '@/components/os/db-unavailable'
import ProductsTable from '@/components/os/products-table'
import styles from '@/components/os/os-shell.module.css'
import shopeeExample from '@/data/os/shopee-example.json'
import { getProductsData } from '@/lib/os-products'

export default async function OsProductsPage() {
  let products: Awaited<ReturnType<typeof getProductsData>> = []
  let dbError = false

  try {
    products = await getProductsData()
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
      </section>
      {dbError ? <DbUnavailable message="Database connection unavailable. Products could not be loaded." /> : null}

      <ProductsTable products={products} shopeeExample={shopeeExample} />
    </>
  )
}
