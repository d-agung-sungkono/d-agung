import ProductsTable from '@/components/os/products-table'
import styles from '@/components/os/os-shell.module.css'
import products from '@/data/os/products.json'
import shopeeExample from '@/data/os/shopee-example.json'

export default function OsProductsPage() {
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

      <ProductsTable products={products} shopeeExample={shopeeExample} />
    </>
  )
}
