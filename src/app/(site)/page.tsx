import Hero from '@/components/home/Hero'
import { systems } from '@/data/systems'

export default function SiteHomePage() {
  const featuredSystem = systems.find((system) => system.featured)
  const selectedSystem =
    systems.find((system) => !system.featured) ?? systems[0] ?? null

  return <Hero featuredSystem={featuredSystem ?? null} selectedSystem={selectedSystem} />
}
