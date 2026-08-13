export const brandStatuses = ['ACTIVE', 'PAUSED', 'ARCHIVED'] as const

export type BrandStatus = (typeof brandStatuses)[number]

export type BrandListItem = {
  connectedSocialAccounts: number
  description: string | null
  id: string
  imageUrl: string | null
  status: BrandStatus
  title: string
  updatedAt: string
  websiteUrl: string | null
}

export type BrandConnectionOption = {
  account: string
  id: string
  label: string
  platform: string
  status: string
  url: string
}

export type BrandSocialAccount = BrandConnectionOption

export type BrandDetail = {
  connections: BrandSocialAccount[]
  contentActivity: {
    planned: number
    published: number
    total: number
  } | null
  createdAt: string
  description: string | null
  direction: string | null
  id: string
  imageUrl: string | null
  nextDevelopment: string | null
  status: BrandStatus
  title: string
  updatedAt: string
  websiteUrl: string | null
}
