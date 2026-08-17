import { query } from '@/lib/db'
import { getOsSession } from '@/lib/os-auth'

type AffiliateImageRow = {
  image_blob: Buffer | null
  image_mime_type: string | null
}

export async function GET(_request: Request, context: RouteContext<'/os/affiliate/image/[id]'>) {
  const session = await getOsSession()

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await context.params
  const result = await query<AffiliateImageRow>(
    `
      SELECT image_blob, image_mime_type
      FROM os_affiliate_products
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [id, session.userId]
  )

  const product = result.rows[0]

  if (!product?.image_blob || !product.image_mime_type) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(new Uint8Array(product.image_blob), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Length': String(product.image_blob.length),
      'Content-Type': product.image_mime_type,
    },
  })
}
