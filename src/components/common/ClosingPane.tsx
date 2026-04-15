import Link from 'next/link'

import styles from './ClosingPane.module.css'

export default function ClosingPane() {
  return (
    <section className={styles.section} aria-label="Closing statement">
      <div className={styles.panel}>
        <nav className={styles.column} aria-label="Navigate">
          <p className={styles.label}>Navigate</p>
          <ul className={styles.linkList}>
            <li>
              <Link href="/" className={styles.link}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/systems" className={styles.link}>
                Systems
              </Link>
            </li>
            <li>
              <Link href="/thinking" className={styles.link}>
                Thinking
              </Link>
            </li>
            <li>
              <Link href="/proof" className={styles.link}>
                Proof
              </Link>
            </li>
            <li>
              <Link href="/off-code" className={styles.link}>
                Off Code
              </Link>
            </li>
          </ul>
        </nav>

        <div className={styles.column}>
          <h2 className={styles.statement}>LET&apos;S BUILD SYSTEMS THAT SCALE.</h2>
          <p className={styles.supporting}>
            Modular architecture, real-world systems, and products designed to
            last.
          </p>
          <a href="mailto:your@email.com" className={styles.primaryLink}>
            Work with me
          </a>
        </div>

        <nav className={styles.column} aria-label="Connect">
          <p className={styles.label}>Connect</p>
          <ul className={styles.linkList}>
            <li>
              <a href="#" className={styles.link}>
                LinkedIn
              </a>
            </li>
            <li>
              <a href="#" className={styles.link}>
                GitHub
              </a>
            </li>
            <li>
              <a href="mailto:your@email.com" className={styles.link}>
                Email
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </section>
  )
}
