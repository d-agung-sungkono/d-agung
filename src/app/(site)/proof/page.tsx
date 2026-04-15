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
    href: 'https://www.coursera.org/account/accomplishments/professional-cert/5SKTSMPC3S6E?utm_source=link&utm_medium=certificate&utm_content=cert_image&utm_campaign=pdf_header_button&utm_product=prof',
  },
  {
    title: 'Meta Front-End Developer Specialization',
    issuer: 'Meta',
    label: 'View Credential',
    href: 'https://www.coursera.org/account/accomplishments/professional-cert/JETVPEZJCDCW',
  },
]

export default function ProofPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Proof</p>
        <h1 className={styles.title}>
          Systems only matter when they survive real-world scale.
        </h1>
        <p className={styles.intro}>
          A snapshot of the scale, impact, and real-world usage behind the systems I’ve built.
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
