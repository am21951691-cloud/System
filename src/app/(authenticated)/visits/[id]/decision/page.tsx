import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import DoctorDecisionForm from '@/components/DoctorDecisionForm'
import PrescriptionImageViewer from '@/components/PrescriptionImageViewer'

export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'doctor' && session.role !== 'admin') {
    redirect(`/visits/${id}`)
  }

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

  // Calculate approval stats among committee
  const approvedCount = visit.committeeReviews.filter((r) => r.decision === 'approved').length
  const rejectedCount = visit.committeeReviews.filter((r) => r.decision === 'rejected').length
  const needsInfoCount = visit.committeeReviews.filter((r) => r.decision === 'needs_info').length

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

      {/* Case Details, Prescription & Committee Reviews */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Prescription & Clinical Info */}
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

          {/* Uploaded Prescription Image */}
          {visit.prescriptionImage && (
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <PrescriptionImageViewer imageUrl={visit.prescriptionImage} title="صورة الروشتة المرفقة بالحالة" />
            </div>
          )}

          <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '12px' }}>
            💊 الأدوية بالروشتة ({visit.medications.length})
          </h3>
          {visit.medications.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {visit.prescriptionImage
                ? 'تم إرفاق صورة الروشتة الأصلية أعلاه (يمكن الاطلاع عليها مباشرة وتكبيرها).'
                : 'لا توجد أدوية مسجلة في هذه الزيارة.'}
            </p>
          ) : (
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
          )}
        </div>

        {/* Committee Reviews Summary (Exclusive to Doctor & Admin) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1rem', margin: 0, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>👥</span>
              <span>توصيات وآراء أعضاء اللجنة الطبية ({visit.committeeReviews.length})</span>
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              (معروضة بالكامل للطبيب)
            </span>
          </div>

          {/* Quick Stats Pill */}
          {visit.committeeReviews.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span className="badge badge-approved" style={{ fontSize: '0.8rem' }}>
                🟢 موافق: {approvedCount}
              </span>
              <span className="badge badge-rejected" style={{ fontSize: '0.8rem' }}>
                🔴 غير موافق: {rejectedCount}
              </span>
              {needsInfoCount > 0 && (
                <span className="badge badge-committee" style={{ fontSize: '0.8rem' }}>
                  🟡 يحتاج معلومات: {needsInfoCount}
                </span>
              )}
            </div>
          )}

          {visit.committeeReviews.length === 0 ? (
            <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              لم يسجل أعضاء اللجنة أي رأي بعد. يمكنك اتخاذ القرار النهائي مباشرة بصفتك طبيباً معتمداً.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
              {visit.committeeReviews.map((r) => (
                <div key={r.id} style={{ padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{r.user.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(r.createdAt).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <div>
                    {r.decision === 'approved' && <span className="badge badge-approved">🟢 موافق على الصرف</span>}
                    {r.decision === 'rejected' && <span className="badge badge-rejected">🔴 غير موافق</span>}
                    {r.decision === 'needs_info' && <span className="badge badge-committee">🟡 يحتاج معلومات إضافية</span>}
                  </div>
                  {r.notes && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '6px', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px' }}>
                      {r.notes}
                    </p>
                  )}
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
