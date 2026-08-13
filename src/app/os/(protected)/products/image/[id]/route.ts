import { query } from '@/lib/db'
import { getOsSession } from '@/lib/os-auth'

type ProductImageRow = {
  primary_image: Buffer | null
  primary_image_mime_type: string | null
}

export async function GET(_request: Request, context: RouteContext<'/os/products/image/[id]'>) {
  const session = await getOsSession()

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await context.params
  const result = await query<ProductImageRow>(
    `
      SELECT primary_image, primary_image_mime_type
      FROM os_products
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [id, session.userId]
  )

  const product = result.rows[0]

  if (!product?.primary_image || !product.primary_image_mime_type) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(new Uint8Array(product.primary_image), {
    headers: {
      'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
      'Content-Length': String(product.primary_image.length),
      'Content-Type': product.primary_image_mime_type,
    },
  })
}
