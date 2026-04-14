import type { WritingItem } from '../types/writing'

export const writings: WritingItem[] = [
  {
    slug: 'why-systems-fail-before-they-scale',
    title: 'Why Systems Fail Before They Scale',
    excerpt:
      'A practical look at early architectural shortcuts that break team velocity and operational reliability.',
    publishedAt: '2025-08-14',
    featured: true,
  },
  {
    slug: 'modular-business-engine-principles',
    title: 'Modular Business Engine Principles',
    excerpt:
      'Design principles for separating core business capabilities into modules that evolve without full rewrites.',
    publishedAt: '2024-11-02',
  },
  {
    slug: 'separating-logic-from-interface',
    title: 'Separating Logic From Interface',
    excerpt:
      'How to keep domain rules independent from UI layers so product changes do not corrupt core behavior.',
    publishedAt: '2024-06-18',
  },
]
