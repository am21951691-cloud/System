import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { sendToCommittee, sendToDoctor } from '@/lib/actions/visit-actions'

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return null

  const visit = await prisma.visit.findUnique({
    where: { id: parseInt(id) },
    include: {
      patient: true,
      medications: true,
      committeeReviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      finalDecision: true,
    },
  })

  if (!visit) return notFound()

  const sendToCommitteeWithId = sendToCommittee.bind(null, visit.id)
  const sendToDoctorWithId = sendToDoctor.bind(null, visit.id)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>📄 تفاصيل الزيارة</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {visit.patient.fullName} — {visit.patient.patientId}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link
            href={`/visits/${visit.id}/print`}
            target="_blank"
            className="btn btn-primary"
            style={{ fontWeight: 600 }}
          >
            🖨️ تقرير الزيارة للطباعة / PDF
          </Link>
          <Link href={`/patients/${visit.patient.id}`} className="btn btn-outline">
            📋 ملف المريض
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1rem' }}>بيانات الزيارة</h2>
          <StatusBadge status={visit.status} />
        </div>
        <div className="grid-3">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>التخصص</div>
            <div>{visit.specialty}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>التشخيص</div>
            <div>{visit.diagnosis || '—'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>الحالة العامة</div>
            <div>{visit.generalCondition || '—'}</div>
          </div>
        </div>
        {visit.description && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>وصف الحالة</div>
            <div style={{ fontSize: '0.9rem' }}>{visit.description}</div>
          </div>
        )}
      </div>

      {visit.medications.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>💊 الروشتة</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>الدواء</th>
                  <th>التركيز</th>
                  <th>الجرعة</th>
                  <th>عدد المرات</th>
                  <th>مدة العلاج</th>
                  <th>الكمية</th>
                </tr>
              </thead>
              <tbody>
                {visit.medications.map((med) => (
                  <tr key={med.id}>
                    <td style={{ fontWeight: 600 }}>{med.name}</td>
                    <td>{med.concentration || '—'}</td>
                    <td>{med.dosage || '—'}</td>
                    <td>{med.frequency || '—'}</td>
                    <td>{med.duration || '—'}</td>
                    <td>{med.quantity || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {visit.committeeReviews.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>📋 مراجعات اللجنة</h2>
          {visit.committeeReviews.map((review) => (
            <div key={review.id} style={{
              padding: '16px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '12px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>{review.user.name}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {new Date(review.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
              <div>
                <span className={`badge ${review.decision === 'approved' ? 'badge-approved' : review.decision === 'rejected' ? 'badge-rejected' : 'badge-committee'}`}>
                  {review.decision === 'approved' ? '✅ موافق' : review.decision === 'rejected' ? '❌ رافض' : '❓ يحتاج معلومات'}
                </span>
              </div>
              {review.notes && (
                <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {review.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {visit.finalDecision && (
        <div className="card" style={{ marginBottom: '24px', borderTop: '3px solid var(--green)' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>⚖️ القرار النهائي</h2>
          <div className="grid-2">
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>نوع القرار</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {visit.finalDecision.decisionType === 'charity' ? '🟢 خيري (مجاني)' :
                 visit.finalDecision.decisionType === 'paid' ? '🔵 مدفوع' : '🔴 مرفوض'}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>الطبيب</div>
              <div>{visit.finalDecision.doctorName || '—'}</div>
            </div>
          </div>
          <div className="grid-3" style={{ marginTop: '12px' }}>
            {visit.finalDecision.dispenseDuration && (
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>مدة الصرف: </span>
                <div>{visit.finalDecision.dispenseDuration}</div>
              </div>
            )}
            {visit.finalDecision.dispenseQuantity && (
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>كمية الصرف: </span>
                <div>{visit.finalDecision.dispenseQuantity}</div>
              </div>
            )}
            {visit.finalDecision.dispenseSchedule && (
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>جدول الصرف: </span>
                <div>{visit.finalDecision.dispenseSchedule}</div>
              </div>
            )}
          </div>
          {visit.finalDecision.reason && (
            <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>السبب / ملاحظات</div>
              <div>{visit.finalDecision.reason}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {visit.status === 'new' && (
          <form action={sendToCommitteeWithId}>
            <button type="submit" className="btn btn-yellow">
              📤 إرسال إلى اللجنة
            </button>
          </form>
        )}
        {visit.status === 'committee_review' && (
          <>
            <Link href={`/visits/${visit.id}/committee`} className="btn btn-yellow">
              📝 إضافة مراجعة لجنة
            </Link>
            <form action={sendToDoctorWithId}>
              <button type="submit" className="btn btn-primary">
                📤 إرسال إلى الطبيب
              </button>
            </form>
          </>
        )}
        {visit.status === 'doctor_review' && (
          <Link href={`/visits/${visit.id}/decision`} className="btn btn-green">
            ⚖️ إصدار القرار النهائي
          </Link>
        )}
      </div>
    </>
  )
}
