import { systems } from '../../data/systems'

export default function SiteHomePage() {
  const featuredSystem = systems.find((system) => system.featured)

  return (
    <>
      <header>
        <p>D Agung</p>
      </header>

      <main>
        <h1>Building systems that stay useful as they grow.</h1>
        <p>
          Personal platform for documenting modular product work, architectural
          decisions, and operational thinking.
        </p>

        <section aria-labelledby="current-build">
          <h2 id="current-build">Current Build</h2>
          {featuredSystem ? (
            <article>
              <h3>{featuredSystem.title}</h3>
              <p>{featuredSystem.summary}</p>
              <p>
                Status: {featuredSystem.status} • Year: {featuredSystem.year}
              </p>
            </article>
          ) : (
            <p>No featured system yet.</p>
          )}
        </section>
      </main>
    </>
  )
}
