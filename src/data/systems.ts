import type { SystemItem } from '../types/system'

export const systems: SystemItem[] = [
  {
    slug: 'umkm-kit',
    title: 'UMKM Kit',
    summary:
      'Modular business engine for UMKM operations, designed to adapt to real workflows - not force them into rigid tools.',
    status: 'in-progress',
    year: '2026',
    featured: true,
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
]
