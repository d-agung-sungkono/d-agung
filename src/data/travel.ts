export type VisitedProvince = {
  province: string
  cities: string[]
  note: string
}

export type VisitedCountry = {
  country: string
  year: string
  city?: string
  note: string
}

export const visitedProvinces: VisitedProvince[] = [
  {
    province: 'Sumatera Utara',
    cities: [],
    note: 'Visited.',
  },
  {
    province: 'Sumatera Selatan',
    cities: [],
    note: 'Visited.',
  },
  {
    province: 'Kepulauan Riau',
    cities: [],
    note: 'Visited.',
  },
  {
    province: 'Jawa Barat',
    cities: [],
    note: 'Visited.',
  },
  {
    province: 'Banten',
    cities: [],
    note: 'Visited.',
  },
  {
    province: 'DKI Jakarta',
    cities: ['Jakarta'],
    note: 'Current base where I stay.',
  },
  {
    province: 'Jawa Tengah',
    cities: ['Semarang'],
    note: 'A city that shaped my early system-building journey.',
  },
  {
    province: 'Daerah Istimewa Yogyakarta',
    cities: ['Yogyakarta'],
    note: 'Visited.',
  },
  {
    province: 'Jawa Timur',
    cities: ['Surabaya'],
    note: 'A major city visited during personal and professional movement.',
  },
  {
    province: 'Bali',
    cities: [],
    note: 'Visited.',
  },
  {
    province: 'Maluku Utara',
    cities: [],
    note: 'Visited.',
  },
  {
    province: 'Kalimantan Tengah',
    cities: [],
    note: 'Visited.',
  },
  {
    province: 'Kalimantan Utara',
    cities: [],
    note: 'Visited.',
  },
  {
    province: 'Kalimantan Timur',
    cities: [],
    note: 'Visited.',
  },
  {
    province: 'Kalimantan Selatan',
    cities: [],
    note: 'Visited.',
  },
  {
    province: 'Sulawesi Barat',
    cities: [],
    note: 'Visited.',
  },
  {
    province: 'Sulawesi Tenggara',
    cities: [],
    note: 'Visited.',
  },
  {
    province: 'Gorontalo',
    cities: [],
    note: 'Visited.',
  },
  {
    province: 'Sulawesi Selatan',
    cities: [],
    note: 'Visited.',
  },
]

export const visitedCountries: VisitedCountry[] = [
  {
    country: 'Singapore',
    year: '2023',
    note: 'First overseas trip.',
  },
  {
    country: 'Norway',
    city: 'Oslo',
    year: '2025',
    note: 'A northern perspective on systems, cities, and movement.',
  },
]
