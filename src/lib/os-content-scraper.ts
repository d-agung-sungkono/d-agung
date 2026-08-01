import 'server-only'

export type ScrapedContentResult = {
  canonicalUrl: string
  description: string | null
  image: string | null
  siteName: string | null
  title: string
}

function decodeHtml(value: string) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

function getAttribute(tag: string, attribute: string) {
  const pattern = new RegExp(`\\s${attribute}=["']([^"']+)["']`, 'i')
  return tag.match(pattern)?.[1] ? decodeHtml(tag.match(pattern)?.[1] ?? '') : ''
}

function getMetaContent(html: string, key: string) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? []

  for (const tag of metaTags) {
    const property = getAttribute(tag, 'property')
    const name = getAttribute(tag, 'name')

    if (property.toLowerCase() === key.toLowerCase() || name.toLowerCase() === key.toLowerCase()) {
      return getAttribute(tag, 'content')
    }
  }

  return ''
}

function getTitle(html: string) {
  const ogTitle = getMetaContent(html, 'og:title')
  const twitterTitle = getMetaContent(html, 'twitter:title')
  const documentTitle = stripTags(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')

  return ogTitle || twitterTitle || documentTitle
}

function getCanonicalUrl(html: string, sourceUrl: URL) {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? []

  for (const tag of linkTags) {
    if (getAttribute(tag, 'rel').toLowerCase() !== 'canonical') {
      continue
    }

    const href = getAttribute(tag, 'href')

    if (href) {
      return new URL(href, sourceUrl).toString()
    }
  }

  const ogUrl = getMetaContent(html, 'og:url')
  return ogUrl ? new URL(ogUrl, sourceUrl).toString() : sourceUrl.toString()
}

function normalizeContentUrl(value: string) {
  const url = new URL(value)

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP or HTTPS content links are supported.')
  }

  return url
}

export async function scrapeContentLink(sourceUrl: string): Promise<ScrapedContentResult> {
  if (!sourceUrl) {
    throw new Error('Content link is required.')
  }

  const url = normalizeContentUrl(sourceUrl)
  const response = await fetch(url.toString(), {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Content scrape failed with HTTP ${response.status}.`)
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('text/html')) {
    throw new Error('Content link did not return an HTML page.')
  }

  const html = await response.text()
  const title = getTitle(html)

  if (!title) {
    throw new Error('Content title was not found on the linked page.')
  }

  return {
    canonicalUrl: getCanonicalUrl(html, url),
    description: getMetaContent(html, 'og:description') || getMetaContent(html, 'description') || null,
    image: getMetaContent(html, 'og:image') || getMetaContent(html, 'twitter:image') || null,
    siteName: getMetaContent(html, 'og:site_name') || null,
    title,
  }
}
