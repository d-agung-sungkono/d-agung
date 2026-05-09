import styles from './OverseasRouteMap.module.css'

const stops = [
  { label: 'Jakarta', x: 36, y: 68 },
  { label: 'Singapore', x: 42, y: 60 },
  { label: 'Oslo', x: 78, y: 20 },
]

export default function OverseasRouteMap() {
  return (
    <div className={styles.wrap} aria-label="Overseas travel route visualization">
      <svg viewBox="0 0 100 80" className={styles.map} role="img" aria-hidden="true">
        <defs>
          <linearGradient id="routeFade" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(86, 208, 135, 0.32)" />
            <stop offset="100%" stopColor="rgba(86, 208, 135, 0.9)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="100" height="80" className={styles.bg} />

        <path d="M 36 68 Q 39 64, 42 60" className={styles.routeSoft} />
        <path d="M 42 60 Q 56 40, 78 20" className={styles.routeMain} />

        {stops.map((stop) => (
          <g key={stop.label}>
            <circle cx={stop.x} cy={stop.y} r="1.6" className={styles.dot} />
            <circle cx={stop.x} cy={stop.y} r="3.2" className={styles.ring} />
          </g>
        ))}
      </svg>

      <div className={styles.legend}>
        <p className={styles.label}>Overseas Path</p>
        <p className={styles.meta}>Jakarta → Singapore (2023) → Oslo (2025)</p>
      </div>
    </div>
  )
}
