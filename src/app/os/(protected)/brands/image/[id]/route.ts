import { query } from '@/lib/db'
import { getOsSession } from '@/lib/os-auth'

type BrandImageRow = {
  image_blob: Buffer | null
  image_mime_type: string | null
  title: string
}

export async function GET(request: Request, context: RouteContext<'/os/brands/image/[id]'>) {
  const session = await getOsSession()

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await context.params
  const result = await query<BrandImageRow>(
    `
      SELECT image_blob, image_mime_type, title
      FROM os_brands
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [id, session.userId]
  )

  const brand = result.rows[0]

  if (!brand?.image_blob || !brand.image_mime_type) {
    return new Response('Not found', { status: 404 })
  }

  const url = new URL(request.url)
  const shouldDownload = url.searchParams.get('download') === 'true'
  const extension = brand.image_mime_type.split('/')[1] || 'image'
  const filename = `${brand.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'brand'}-logo.${extension}`

  return new Response(new Uint8Array(brand.image_blob), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': shouldDownload ? `attachment; filename="${filename}"` : 'inline',
      'Content-Length': String(brand.image_blob.length),
      'Content-Type': brand.image_mime_type,
    },
  })
}
