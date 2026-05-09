import type { SystemItem } from '../types/system'

export const systems: SystemItem[] = [
  {
    slug: 'umkm-kit',
    title: 'WarungKit',
    summary:
      'A practical operating layer for UMKM: catalog, orders, and daily flow in one place.',
    status: 'running',
    year: '2026',
    featured: true,
    productUrl: 'https://warungkit.netlify.app',
    productLabel: 'Visit WarungKit',
  },
  {
    slug: 'wriday',
    title: 'Wriday',
    summary:
      'Simple daily quiz that feels like a game, but quietly builds English writing consistency through bite-size practice and direct feedback.',
    status: 'exploring',
    year: '2026',
  },
  {
    slug: 'fasih-form-gear',
    title: 'Form Gear - FASIH',
    summary:
      'Configurable form engine for national-scale surveys with validation rules, branching logic, and stable submission pipelines.',
    status: 'done',
    year: '2022',
  },
  {
    slug: 'quality-gate-qg',
    title: 'QG Systems',
    summary:
      'Quality assurance system used across dozens of surveys and national census workflows, designed to enforce consistent evaluation and validation at scale. Originally built as a monolithic system, still actively used across production workflows.',
    status: 'running',
    year: '2023',
  },
  {
    slug: 'laviumhub',
    title: 'LaviumHub',
    summary:
      'UMKM laundry landing page with service catalog, machine usage monitoring, and delivery cost checking.',
    status: 'running',
    year: '2025',
    productUrl: 'https://laviumhub.netlify.app',
    productLabel: 'Visit LaviumHub',
  },
]
