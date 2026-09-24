import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import VisitTimeline from '@/components/VisitTimeline'

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(id) },
    include: {
      visits: {
        orderBy: { createdAt: 'desc' },
        include: { finalDecision: true },
      },
    },
  })

  if (!patient) return notFound()

  return (
    <>
      <div className="page-header">
        <h1>📋 ملف المريض</h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link
            href={`/patients/${patient.id}/print`}
            target="_blank"
            className="btn btn-outline"
            style={{ fontWeight: 600 }}
          >
            📚 تحميل / طباعة التاريخ الكامل (PDF)
          </Link>
          <Link href={`/patients/${patient.id}/visits/new`} className="btn btn-primary">
            ➕ إضافة زيارة جديدة
          </Link>
          <Link href="/dashboard" className="btn btn-outline">
            ← لوحة التحكم
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="grid-3">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>الاسم</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{patient.fullName}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>رقم الملف</div>
            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{patient.patientId}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>الهاتف</div>
            <div>{patient.phone || '—'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>تاريخ الميلاد / السن</div>
            <div>{patient.birthDate || '—'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>الجنس</div>
            <div>{patient.gender || '—'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>المحافظة / المدينة</div>
            <div>{[patient.governorate, patient.city].filter(Boolean).join(' - ') || '—'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>الحالة الاجتماعية</div>
            <div>{patient.maritalStatus || '—'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>الحالة المادية</div>
            <div>{patient.financialStatus || '—'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>العنوان</div>
            <div>{patient.address || '—'}</div>
          </div>
        </div>
        {patient.notes && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>ملاحظات</div>
            <div style={{ fontSize: '0.9rem' }}>{patient.notes}</div>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
        📅 سجل الزيارات ({patient.visits.length})
      </h2>
      <VisitTimeline visits={patient.visits} />
    </>
  )
}
