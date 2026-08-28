import type { SystemItem } from '../types/system'

export const systems: SystemItem[] = [
  {
    slug: 'warungkit',
    title: 'WarungKit',
    summary:
      'A vertical business engine that helps independent businesses publish a polished website, manage the work behind it, and grow through simple automation.',
    status: 'running',
    year: '2026',
    featured: true,
    productUrl: 'https://warungkit.com',
    productLabel: 'Visit WarungKit',
  },
  {
    slug: 'wriday',
    title: 'Wriday',
    summary:
      'An early writing-practice idea that is still being questioned because many similar tools already exist, and the unique angle is not clear yet.',
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
      'Brand-first website for a laundry business that is becoming more serious, expanding into multiple services, and needs a stronger public presence.',
    status: 'running',
    year: '2025',
    productUrl: 'https://laviumhub.com',
    productLabel: 'Visit LaviumHub',
  },
]
