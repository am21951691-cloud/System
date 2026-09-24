import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import DoctorDecisionForm from '@/components/DoctorDecisionForm'

export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return null


  const visit = await prisma.visit.findUnique({
    where: { id: parseInt(id) },
    include: {
      patient: {
        include: {
          visits: {
            where: { id: { not: parseInt(id) } },
            orderBy: { createdAt: 'desc' },
            include: { finalDecision: true },
          },
        },
      },
      medications: true,
      committeeReviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!visit) return notFound()

  return (
    <>
      <div className="page-header">
        <div>
          <h1>⚖️ إصدار القرار النهائي للطبيب</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            المريض: {visit.patient.fullName} ({visit.patient.patientId}) — زيارة {visit.specialty}
          </p>
        </div>
        <Link href={`/visits/${visit.id}`} className="btn btn-outline">
          ← عودة لتفاصيل الزيارة
        </Link>
      </div>

      {/* Case Details & Prescription */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <h2 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--primary)' }}>
            🩺 بيانات الحالة والروشتة الطبية
          </h2>
          <div>
            <div><strong>التخصص:</strong> {visit.specialty}</div>
            {visit.generalCondition && <div><strong>الحالة العامة:</strong> {visit.generalCondition}</div>}
            {visit.diagnosis && <div><strong>التشخيص:</strong> {visit.diagnosis}</div>}
            {visit.description && <div style={{ marginTop: '4px' }}><strong>الوصف:</strong> {visit.description}</div>}
          </div>

          <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '12px' }}>
            💊 الأدوية بالروشتة ({visit.medications.length})
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>الدواء</th>
                  <th>الجرعة والتكرار</th>
                  <th>المدة</th>
                  <th>الكمية</th>
                </tr>
              </thead>
              <tbody>
                {visit.medications.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.name} {m.concentration || ''}</td>
                    <td>{[m.dosage, m.frequency].filter(Boolean).join(' • ') || '—'}</td>
                    <td>{m.duration || '—'}</td>
                    <td style={{ color: 'var(--primary)' }}>{m.quantity || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Committee Reviews Summary */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--yellow)' }}>
            📋 آراء وتوصيات أعضاء اللجنة الطبية ({visit.committeeReviews.length})
          </h2>
          {visit.committeeReviews.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>لم يسجل أعضاء اللجنة أي رأي بعد.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {visit.committeeReviews.map((r) => (
                <div key={r.id} style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>{r.user.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(r.createdAt).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <div>
                    {r.decision === 'approved' && <span className="badge badge-approved">🟢 موافق على الصرف</span>}
                    {r.decision === 'rejected' && <span className="badge badge-rejected">🔴 غير موافق</span>}
                    {r.decision === 'needs_info' && <span className="badge badge-committee">🟡 يحتاج معلومات إضافية</span>}
                  </div>
                  {r.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{r.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Decision Form Card */}
      <div className="card" style={{ borderTop: '3px solid var(--green)' }}>
        <DoctorDecisionForm visitId={visit.id} />
      </div>
    </>
  )
}
