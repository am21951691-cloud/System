import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'

interface Visit {
  id: number
  specialty: string
  status: string
  createdAt: Date
  finalDecision?: { decisionType: string; dispenseDuration?: string | null } | null
}

export default function VisitTimeline({ visits }: { visits: Visit[] }) {
  if (visits.length === 0) {
    return <p style={{ color: 'var(--text-secondary)' }}>لا توجد زيارات مسجلة لهذا المريض بعد.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {visits.map((visit) => (
        <div
          key={visit.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {new Date(visit.createdAt).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
              زيارة تخصص: <strong>{visit.specialty}</strong>
            </div>
            {visit.finalDecision && (
              <div style={{ fontSize: '0.8rem', marginTop: '4px', color: visit.finalDecision.decisionType === 'denied' ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>
                {visit.finalDecision.decisionType === 'charity' ? '🟢 صرف كصدقة (مجاني)' :
                 visit.finalDecision.decisionType === 'paid' ? '🔵 صرف بمقابل مالي' : '🔴 تم رفض الصرف'}
                {visit.finalDecision.dispenseDuration ? ` — مدة الصرف: ${visit.finalDecision.dispenseDuration}` : ''}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <StatusBadge status={visit.status} />

            <Link
              href={`/visits/${visit.id}/print`}
              target="_blank"
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="طباعة أو تحميل تقرير الزيارة كـ PDF"
            >
              🖨️ تقرير PDF
            </Link>

            <Link
              href={`/visits/${visit.id}`}
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              عرض التفاصيل
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
