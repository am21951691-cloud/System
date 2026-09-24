import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { submitCommitteeReview } from '@/lib/actions/committee-actions'

export default async function CommitteeReviewPage({ params }: { params: Promise<{ id: string }> }) {
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

  const submitReviewWithVisit = submitCommitteeReview.bind(null, visit.id)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>✍️ مراجعة وإبداء رأي اللجنة الطبية</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            المريض: {visit.patient.fullName} ({visit.patient.patientId}) — زيارة {visit.specialty}
          </p>
        </div>
        <Link href={`/visits/${visit.id}`} className="btn btn-outline">
          ← عودة لتفاصيل الزيارة
        </Link>
      </div>

      {/* Grid: Case Details & Patient History */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Current Case & Prescription */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--primary)' }}>
            🩺 بيانات الحالة الحالية والروشتة
          </h2>
          <div style={{ marginBottom: '12px' }}>
            <div><strong>التخصص:</strong> {visit.specialty}</div>
            {visit.generalCondition && <div><strong>الحالة العامة:</strong> {visit.generalCondition}</div>}
            {visit.diagnosis && <div><strong>التشخيص:</strong> {visit.diagnosis}</div>}
            {visit.description && <div style={{ marginTop: '4px' }}><strong>الوصف:</strong> {visit.description}</div>}
          </div>

          <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            💊 الأدوية المطلوبة في الروشتة ({visit.medications.length})
          </h3>
          {visit.medications.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>لا توجد أدوية مسجلة في هذه الزيارة</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>الدواء</th>
                    <th>الجرعة والتكرار</th>
                    <th>المدة</th>
                    <th>الكمية المقترحة</th>
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

        {/* Patient Profile & Past Dispensing History */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', marginBottom: '12px', color: '#38bdf8' }}>
            👤 الملف التاريخي للمريض وقرارات الصرف السابقة
          </h2>
          <div style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
            <div><strong>الحالة المادية:</strong> {visit.patient.financialStatus || 'غير محددة'}</div>
            <div><strong>المدينة / المحافظة:</strong> {[visit.patient.city, visit.patient.governorate].filter(Boolean).join(' - ') || '—'}</div>
            <div><strong>الهاتف:</strong> {visit.patient.phone || '—'}</div>
            {visit.patient.notes && <div style={{ marginTop: '4px' }}><strong>ملاحظات المريض:</strong> {visit.patient.notes}</div>}
          </div>

          <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            📅 الزيارات وقرارات الصرف السابقة ({visit.patient.visits.length})
          </h3>
          {visit.patient.visits.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>هذه أول زيارة للمريض في المجمع (سجل جديد).</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {visit.patient.visits.map((pv) => (
                <div key={pv.id} style={{ padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>{pv.specialty} — {new Date(pv.createdAt).toLocaleDateString('ar-EG')}</span>
                    <span>
                      {pv.finalDecision ? (
                        pv.finalDecision.decisionType === 'charity' ? '🟢 صُرف صدقة' :
                        pv.finalDecision.decisionType === 'paid' ? '🔵 صُرف بمقابل' : '🔴 لم يصرف'
                      ) : 'قيد المراجعة'}
                    </span>
                  </div>
                  {pv.finalDecision?.dispenseDuration && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      المدة: {pv.finalDecision.dispenseDuration} | الكمية: {pv.finalDecision.dispenseQuantity || '—'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Existing Committee Reviews */}
      {visit.committeeReviews.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '12px' }}>
            👥 آراء أعضاء اللجنة المسجلة حتى الآن ({visit.committeeReviews.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visit.committeeReviews.map((r) => (
              <div key={r.id} style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong>{r.user.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(r.createdAt).toLocaleString('ar-EG')}
                  </span>
                </div>
                <div>
                  {r.decision === 'approved' && <span className="badge badge-approved">🟢 موافق على الصرف</span>}
                  {r.decision === 'rejected' && <span className="badge badge-rejected">🔴 غير موافق</span>}
                  {r.decision === 'needs_info' && <span className="badge badge-committee">🟡 يحتاج معلومات إضافية</span>}
                </div>
                {r.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>{r.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The Review Submission Form */}
      <div className="card" style={{ borderTop: '3px solid var(--yellow)' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
          ✍️ تسجيل رأيك كعضو في اللجنة ({session.name})
        </h2>

        <form action={submitReviewWithVisit}>
          <div className="form-group">
            <label style={{ fontSize: '0.95rem', marginBottom: '8px' }}>الرأي المقترح للحالة *</label>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <input type="radio" name="decision" value="approved" required />
                <span style={{ fontWeight: 600, color: 'var(--green)' }}>🟢 موافق على الصرف</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <input type="radio" name="decision" value="rejected" required />
                <span style={{ fontWeight: 600, color: 'var(--red)' }}>🔴 غير موافق على الصرف</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <input type="radio" name="decision" value="needs_info" required />
                <span style={{ fontWeight: 600, color: 'var(--yellow)' }}>🟡 يحتاج معلومات إضافية</span>
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>ملاحظات وتوصيات العضو (اختياري)</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="مثال: نوصي بصرف العلاج كاملاً نظراً للحالة الاجتماعية للمريض..."
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 32px' }}>
              ✅ اعتماد وتسجيل الرأي
            </button>
            <Link href={`/visits/${visit.id}`} className="btn btn-outline">
              إلغاء
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}
