import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { submitCommitteeReview } from '@/lib/actions/committee-actions'
import PrescriptionImageViewer from '@/components/PrescriptionImageViewer'

export default async function CommitteeReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return redirect('/login')

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

  // Confidentiality rule: Only doctor and admin can see all members' opinions
  const canSeeAllReviews = session.role === 'doctor' || session.role === 'admin'
  const myReview = visit.committeeReviews.find((r) => r.userId === session.userId)

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
        {/* Current Case & Prescription Details */}
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

          {/* Uploaded Prescription Image */}
          {visit.prescriptionImage && (
            <div style={{ marginBottom: '16px' }}>
              <PrescriptionImageViewer imageUrl={visit.prescriptionImage} title="صورة الروشتة المرفقة بالحالة" />
            </div>
          )}

          {/* Medications List */}
          <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            💊 الأدوية المفرغة في الروشتة ({visit.medications.length})
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
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

      {/* Committee Reviews Visibility Section */}
      {canSeeAllReviews ? (
        /* Only Doctor and Admin can see all members' opinions */
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👥</span>
              <span>كافة آراء أعضاء اللجنة الطبية المسجلة ({visit.committeeReviews.length})</span>
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              🔒 خاص بالطبيب المعتمد ومدير النظام
            </span>
          </div>

          {visit.committeeReviews.length === 0 ? (
            <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              لم يسجل أي عضو في اللجنة الطبية رأيه بعد في هذه الحالة.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visit.committeeReviews.map((r) => (
                <div key={r.id} style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{r.user.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(r.createdAt).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    {r.decision === 'approved' && <span className="badge badge-approved">🟢 موافق على الصرف</span>}
                    {r.decision === 'rejected' && <span className="badge badge-rejected">🔴 غير موافق على الصرف</span>}
                    {r.decision === 'needs_info' && <span className="badge badge-committee">🟡 يحتاج معلومات إضافية</span>}
                  </div>
                  {r.notes && (
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '4px' }}>
                      <strong>ملاحظات العضو:</strong> {r.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Regular Committee Member view: Only shows their own review */
        myReview && (
          <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--green)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '1rem', margin: 0, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✅</span>
                <span>رأيك المسجل مسبقاً في هذه الحالة</span>
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {new Date(myReview.createdAt).toLocaleString('ar-EG')}
              </span>
            </div>
            <div style={{ marginTop: '8px' }}>
              {myReview.decision === 'approved' && <span className="badge badge-approved">🟢 موافق على الصرف</span>}
              {myReview.decision === 'rejected' && <span className="badge badge-rejected">🔴 غير موافق على الصرف</span>}
              {myReview.decision === 'needs_info' && <span className="badge badge-committee">🟡 يحتاج معلومات إضافية</span>}
            </div>
            {myReview.notes && (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                {myReview.notes}
              </p>
            )}
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
              🔒 حفاظاً على حيادية واستقلالية التقييم، يُعرض رأيك فقط، بينما يستطيع الطبيب المعتمد ومدير النظام الاطلاع على آراء كافة الأعضاء. يمكنك تعديل رأيك أدناه إن أردت.
            </div>
          </div>
        )
      )}

      {/* The Review Submission Form */}
      <div className="card" style={{ borderTop: '3px solid var(--yellow)' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
          ✍️ {myReview ? 'تعديل أو تحديث رأيك كعضو في اللجنة' : 'تسجيل رأيك كعضو في اللجنة'} ({session.name})
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '16px' }}>
          🔒 رأيك وتوصياتك تذهب بسرية تامة لمراجعة الطبيب المعتمد ومدير النظام لاتخاذ القرار النهائي.
        </p>

        <form action={submitReviewWithVisit}>
          <div className="form-group">
            <label style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>الرأي المقترح للحالة *</label>
            <div className="grid-3">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', padding: '14px 20px', minHeight: '52px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '2px solid rgba(16, 185, 129, 0.4)' }}>
                <input
                  type="radio"
                  name="decision"
                  value="approved"
                  required
                  defaultChecked={myReview?.decision === 'approved'}
                />
                <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '1.05rem' }}>🟢 موافق على الصرف</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', padding: '14px 20px', minHeight: '52px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '2px solid rgba(244, 63, 94, 0.4)' }}>
                <input
                  type="radio"
                  name="decision"
                  value="rejected"
                  required
                  defaultChecked={myReview?.decision === 'rejected'}
                />
                <span style={{ fontWeight: 700, color: 'var(--red)', fontSize: '1.05rem' }}>🔴 غير موافق على الصرف</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', padding: '14px 20px', minHeight: '52px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '2px solid rgba(245, 158, 11, 0.4)' }}>
                <input
                  type="radio"
                  name="decision"
                  value="needs_info"
                  required
                  defaultChecked={myReview?.decision === 'needs_info'}
                />
                <span style={{ fontWeight: 700, color: 'var(--yellow)', fontSize: '1.05rem' }}>🟡 يحتاج معلومات إضافية</span>
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>ملاحظات وتوصيات العضو (اختياري)</label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={myReview?.notes || ''}
              placeholder="مثال: نوصي بصرف العلاج كاملاً نظراً للحالة الاجتماعية للمريض..."
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '14px', marginTop: '24px', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1, minWidth: '220px' }}>
              ✅ {myReview ? 'حفظ وتحديث الرأي' : 'اعتماد وتسجيل الرأي'}
            </button>
            <Link href={`/visits/${visit.id}`} className="btn btn-outline" style={{ minWidth: '120px' }}>
              إلغاء
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}
