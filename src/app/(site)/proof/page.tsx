import styles from '../thinking/thinking.module.css'

const impactPoints = [
  '1000+ users across internal national systems',
  'Used in large-scale survey and census programs',
  'Sub-minute rendering for complex forms',
  'Adopted across multiple regional offices',
]

const trackRecordPoints = [
  '4+ years building national-scale systems',
  'Experience across data collection, processing, and QA platforms',
  'Focused on modular and scalable architecture',
]

const credentials = [
  {
    title: 'Google Project Management Certificate',
    issuer: 'Google',
    label: 'View Certificate',
    href: 'https://www.coursera.org/professional-certificates/google-project-management',
  },
  {
    title: 'Meta Front-End Developer Specialization',
    issuer: 'Meta',
    label: 'View Credential',
    href: 'https://www.coursera.org/professional-certificates/meta-front-end-developer',
  },
]

export default function ProofPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Proof</p>
        <h1 className={styles.title}>
          Built systems are only meaningful when they work at scale.
        </h1>
        <p className={styles.intro}>
          This page reflects the impact, scale, and experience behind the
          systems.
        </p>
      </header>

      <article className={styles.article}>
        <section className={styles.articleSection} aria-labelledby="impact">
          <h2 id="impact" className={styles.sectionTitle}>
            Impact
          </h2>
          <ul>
            {impactPoints.map((point) => (
              <li key={point} className={styles.paragraph}>
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.articleSection} aria-labelledby="track-record">
          <h2 id="track-record" className={styles.sectionTitle}>
            Track Record
          </h2>
          <ul>
            {trackRecordPoints.map((point) => (
              <li key={point} className={styles.paragraph}>
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.articleSection} aria-labelledby="credentials">
          <h2 id="credentials" className={styles.sectionTitle}>
            Credentials
          </h2>
          <ul>
            {credentials.map((credential) => (
              <li key={credential.title} className={styles.paragraph}>
                <p>
                  <strong>{credential.title}</strong>
                </p>
                <p className={styles.meta}>Issued by {credential.issuer}</p>
                <p>
                  <a href={credential.href} target="_blank" rel="noopener noreferrer">
                    {credential.label}
                  </a>
                </p>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  )
}
