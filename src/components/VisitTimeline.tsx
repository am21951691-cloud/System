import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'

interface Visit {
  id: number
  specialty: string
  status: string
  createdAt: Date
  finalDecision?: { decisionType: string } | null
}

export default function VisitTimeline({ visits }: { visits: Visit[] }) {
  if (visits.length === 0) {
    return <p style={{ color: 'var(--text-secondary)' }}>لا توجد زيارات بعد</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {visits.map((visit) => (
        <Link
          key={visit.id}
          href={`/visits/${visit.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            transition: 'border-color 0.2s',
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>
              {new Date(visit.createdAt).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
              زيارة — {visit.specialty}
            </div>
          </div>
          <StatusBadge status={visit.status} />
        </Link>
      ))}
    </div>
  )
}
