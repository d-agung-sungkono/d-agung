export type SystemStatus = 'idea' | 'exploring' | 'in-progress' | 'running' | 'done'

export type SystemImage = {
  src: string
  alt: string
  caption?: string
}

export type SystemItem = {
  slug: string
  title: string
  summary: string
  status: SystemStatus
  year: string
  featured?: boolean
  productUrl?: string
  productLabel?: string
  images?: SystemImage[]
}
