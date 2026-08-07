import { NextResponse } from 'next/server'

import { getOsSession } from '@/lib/os-auth'
import { getProductsData, type ProductSnapshotOption } from '@/lib/os-products'

function isJakmallSource(source: string) {
  return source.toLowerCase().replace(/[^a-z0-9]/g, '') === 'jakmall'
}

function formatSnapshotDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

function formatSnapshotLabel(snapshot: ProductSnapshotOption | null) {
  if (!snapshot) {
    return 'snapshot terakhir'
  }

  return `${snapshot.number ? `Snapshot ${snapshot.number}` : 'Snapshot'} (${formatSnapshotDate(snapshot.date)})`
}

export async function GET() {
  const session = await getOsSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { products, snapshots } = await getProductsData()
  const latestSnapshot = snapshots[0] ?? null
  const latestSnapshotId = latestSnapshot?.id ?? ''
  const rows = products
    .map((product) => {
      const jakmallLink = product.supplierLinks.find((link) => isJakmallSource(link.source))
      const bruto = jakmallLink?.snapshots.find((snapshot) => snapshot.runId === latestSnapshotId)?.finalPrice ?? jakmallLink?.current?.finalPrice ?? null

      if (bruto === null) {
        return null
      }

      return {
        id: product.id,
        modal: bruto,
        name: product.name,
        primaryImageUrl: product.primaryImageUrl,
        sku: product.sku,
      }
    })
    .filter((product): product is NonNullable<typeof product> => Boolean(product))

  return NextResponse.json({
    rows,
    snapshotLabel: formatSnapshotLabel(latestSnapshot),
  })
}
