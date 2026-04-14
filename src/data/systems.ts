import type { SystemItem } from '../types/system'

export const systems: SystemItem[] = [
  {
    slug: 'warungkit',
    title: 'WarungKit',
    summary:
      'Modular business engine for UMKM operations, covering catalog, order flow, and lightweight reporting.',
    status: 'in-progress',
    year: '2025',
    featured: true,
    productUrl: 'https://warungkit.id',
    productLabel: 'Visit WarungKit',
  },
  {
    slug: 'fasih-form-gear',
    title: 'Fasih Form Gear',
    summary:
      'Configurable form engine for national-scale surveys with validation rules, branching logic, and stable submission pipelines.',
    status: 'done',
    year: '2023',
    images: [
      {
        src: '/images/fasih-1.png',
        alt: 'Fasih Form Gear instrument workspace',
        caption: 'Configurable instrument workspace for large-scale survey operations.',
      },
      {
        src: '/images/fasih-2.png',
        alt: 'Fasih Form Gear review and validation flow',
        caption: 'Validation and review flow used before field rollout.',
      },
    ],
  },
  {
    slug: 'sadewa',
    title: 'Sadewa',
    summary:
      'Self-assessment platform for statistical quality assurance, designed to standardize scoring and evidence tracking.',
    status: 'done',
    year: '2024',
  },
]
