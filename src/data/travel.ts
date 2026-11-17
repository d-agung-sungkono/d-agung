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
    province: 'Aceh',
    cities: ['Langsa'],
    note: 'Visited.',
  },
  {
    province: 'Sumatera Utara',
    cities: ['Medan', 'Pakpak Bharat'],
    note: 'Visited.',
  },
  {
    province: 'Sumatera Selatan',
    cities: ['OKI', 'Palembang'],
    note: 'Visited.',
  },
  {
    province: 'Kepulauan Riau',
    cities: ['Tanjung Pinang'],
    note: 'Visited.',
  },
  {
    province: 'Jambi',
    cities: ['Jambi'],
    note: 'Visited.',
  },
  {
    province: 'Jawa Barat',
    cities: ['Bandung'],
    note: 'Visited.',
  },
  {
    province: 'Banten',
    cities: ['Tangerang'],
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
    cities: ['Banjarmasin'],
    note: 'Visited.',
  },
  {
    province: 'Sulawesi Barat',
    cities: ['Mamuju'],
    note: 'Visited.',
  },
  {
    province: 'Sulawesi Tenggara',
    cities: ['Kendari'],
    note: 'Visited.',
  },
  {
    province: 'Gorontalo',
    cities: ['Gorontalo'],
    note: 'Visited.',
  },
  {
    province: 'Sulawesi Selatan',
    cities: ['Makassar', 'Maros'],
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
