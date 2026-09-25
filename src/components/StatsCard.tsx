export default function StatsCard({
  title,
  count,
  color,
}: {
  title: string
  count: number
  color: string
}) {
  return (
    <div
      className="stat-card-box"
      style={{
        borderTop: `4px solid ${color}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40px',
          background: `radial-gradient(ellipse at top, ${color}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{ fontSize: '2.4rem', fontWeight: 800, color, letterSpacing: '-1px' }}>
        {count}
      </div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
        {title}
      </div>
    </div>
  )
}
