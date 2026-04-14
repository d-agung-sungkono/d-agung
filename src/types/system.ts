export type SystemStatus = 'idea' | 'exploring' | ' running' | 'in-progress' | 'done'

export type SystemItem = {
  slug: string
  title: string
  summary: string
  status: SystemStatus
  year: string
  featured?: boolean
}
