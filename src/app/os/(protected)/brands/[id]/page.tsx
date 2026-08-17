import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import BrandDetailView from '@/components/os/brand-detail-view'
import DbUnavailable from '@/components/os/db-unavailable'
import styles from '@/components/os/os-shell.module.css'
import { getBrandDetail } from '@/lib/os-brands'

type OsBrandDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function OsBrandDetailPage({ params }: OsBrandDetailPageProps) {
  await connection()

  const { id } = await params
  let detailData: Awaited<ReturnType<typeof getBrandDetail>> | null | undefined

  try {
    detailData = await getBrandDetail(id)
  } catch (error) {
    console.error(`Failed to load Agung OS brand detail for ${id}`, error)
  }

  if (detailData === null) {
    notFound()
  }

  if (!detailData) {
    return (
      <section className={styles.panel}>
        <h3 className={styles.panelTitle}>Brand detail unavailable</h3>
        <DbUnavailable message="Database connection unavailable. Brand detail could not be loaded." />
      </section>
    )
  }

  return <BrandDetailView allConnectionOptions={detailData.allConnectionOptions} brand={detailData.brand} />
}
