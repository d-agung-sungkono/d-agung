import { query } from '@/lib/db'

type AffiliateImageRow = {
  image_blob: Buffer | null
  image_mime_type: string | null
}

export async function GET(_request: Request, context: RouteContext<'/affiliate/image/[id]'>) {
  const { id } = await context.params
  const result = await query<AffiliateImageRow>(
    `
      SELECT image_blob, image_mime_type
      FROM os_affiliate_products
      WHERE id = $1
        AND is_active = true
      LIMIT 1
    `,
    [id]
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
