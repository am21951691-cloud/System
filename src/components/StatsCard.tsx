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
    <div className="card" style={{
      textAlign: 'center',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{count}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
        {title}
      </div>
    </div>
  )
}
