import products from './affiliate-products.json'

export type AffiliateProductType = 'affiliate' | 'dropship' | 'owned'
export type AffiliateMarketplace = 'shopee' | 'tokopedia' | 'other'

export type AffiliateProduct = {
  id: string
  code: string
  name: string
  image: string
  contentLinks?: AffiliateProductContentLink[]
  type: AffiliateProductType
  marketplace: AffiliateMarketplace
  destinationUrl: string
  isActive: boolean
  sortOrder: number
}

export type AffiliateProductContentLink = {
  id: string
  title: string | null
  url: string
  sortOrder: number
  platform?: string | null
  account?: string | null
  status?: string | null
}

export const affiliateProducts = (products as AffiliateProduct[])
  .filter((product) => product.isActive)
  .sort((first, second) => first.sortOrder - second.sortOrder)
