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

  // Accountant role has no business in committee reviews
  if (session.role === 'accountant') {
    redirect(`/visits/${id}`)
  }

  // Strict Privacy: medications are NOT queried or exposed for committee review
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
      committeeReviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!visit) return notFound()

  // If already approved or rejected, review phase is closed (tamper-proof lock)
  if (visit.status === 'approved' || visit.status === 'rejected') {
    redirect(`/visits/${visit.id}`)
  }

  const submitReviewWithVisit = submitCommitteeReview.bind(null, visit.id)

  // Confidentiality rule: Only doctor and admin can see all members' opinions
  const canSeeAllReviews = session.role === 'doctor' || session.role === 'admin'
  const myReview = visit.committeeReviews.find((r) => r.userId === session.userId)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>✍️ مراجعة وإبداء توصية اللجنة الطبية</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            المريض: {visit.patient.fullName} ({visit.patient.patientId}) — زيارة {visit.specialty}
          </p>
        </div>
        <Link href={`/visits/${visit.id}`} className="btn btn-outline">
          ← عودة لتفاصيل الزيارة
        </Link>
      </div>

      {/* Grid: Case Clinical Need & Patient History */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Current Case Details & Prescription Image */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--primary)' }}>
            🩺 بيانات الحالة والروشتة الطبية
          </h2>
          <div style={{ marginBottom: '14px', lineHeight: '1.8' }}>
            <div><strong>التخصص:</strong> {visit.specialty}</div>
            {visit.generalCondition && <div><strong>الحالة العامة:</strong> {visit.generalCondition}</div>}
            {visit.diagnosis && <div><strong>التشخيص الطبي:</strong> {visit.diagnosis}</div>}
            {visit.description && <div style={{ marginTop: '4px' }}><strong>وصف الحالة:</strong> {visit.description}</div>}
          </div>

          {/* Uploaded Prescription Image */}
          {visit.prescriptionImage ? (
            <div style={{ marginTop: '12px' }}>
              <PrescriptionImageViewer imageUrl={visit.prescriptionImage} title="صورة الروشتة المرفقة بالحالة" />
            </div>
          ) : (
            <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              لم يتم إرفاق صورة روشتة في هذه الزيارة.
            </div>
          )}

          <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            🔒 تقوم اللجنة الطبية بتقييم الاحتياج السريري والاجتماعي للحالة وصورة الروشتة، بينما يختص الطبيب المعتمد فقط بتفريغ الأدوية واعتماد الصرف النهائي.
          </div>
        </div>

        {/* Patient Profile & Past Dispensing History */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', marginBottom: '12px', color: '#38bdf8' }}>
            👤 الملف التاريخي والاجتماعي للمريض
          </h2>
          <div style={{ fontSize: '0.88rem', marginBottom: '16px', lineHeight: '1.8' }}>
            <div><strong>الحالة المادية / الاجتماعية:</strong> {visit.patient.financialStatus || 'غير محددة'}</div>
            <div><strong>المدينة / المحافظة:</strong> {[visit.patient.city, visit.patient.governorate].filter(Boolean).join(' - ') || '—'}</div>
            <div><strong>الهاتف:</strong> {visit.patient.phone || '—'}</div>
            {visit.patient.notes && <div style={{ marginTop: '4px' }}><strong>ملاحظات الملف:</strong> {visit.patient.notes}</div>}
          </div>

          <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            📅 الزيارات والقرارات السابقة في المجمع ({visit.patient.visits.length})
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
                        pv.finalDecision.decisionType === 'approved' || pv.finalDecision.decisionType === 'charity'
                          ? '🟢 صُرف'
                          : pv.finalDecision.decisionType === 'paid'
                          ? '🔵 صُرف بمقابل'
                          : '🔴 لم يصرف'
                      ) : 'قيد المراجعة'}
                    </span>
                  </div>
                  {pv.finalDecision?.dispenseDuration && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      المدة: {pv.finalDecision.dispenseDuration}
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
              <span>كافة توصيات أعضاء اللجنة الطبية المسجلة ({visit.committeeReviews.length})</span>
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              🔒 خاص بالطبيب المعتمد ومدير النظام
            </span>
          </div>

          {visit.committeeReviews.length === 0 ? (
            <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              لم يسجل أي عضو في اللجنة الطبية توصيته بعد في هذه الحالة.
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
                    {r.decision === 'paid' && <span className="badge badge-doctor">🔵 يصرف بمال</span>}
                    {r.decision === 'charity' && <span className="badge badge-approved">🟢 يصرف كصدقة</span>}
                    {r.decision === 'zakat' && <span className="badge badge-committee">🟣 يصرف كزكاة مال</span>}
                    {r.decision === 'denied' && <span className="badge badge-rejected">🔴 لا يصرف</span>}
                    {r.decision === 'approved' && <span className="badge badge-approved">🟢 موافق على الصرف</span>}
                    {r.decision === 'rejected' && <span className="badge badge-rejected">🔴 غير موافق</span>}
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

          {session.role === 'doctor' && (
            <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-start' }}>
              <Link href={`/visits/${visit.id}/decision`} className="btn btn-green btn-lg">
                ⚖️ الانتقال إلى اتخاذ القرار النهائي وتفريغ الأدوية ←
              </Link>
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
                <span>توصيتك المسجلة مسبقاً في هذه الحالة</span>
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {new Date(myReview.createdAt).toLocaleString('ar-EG')}
              </span>
            </div>
            <div style={{ marginTop: '8px' }}>
              {myReview.decision === 'paid' && <span className="badge badge-doctor">🔵 يصرف بمال</span>}
              {myReview.decision === 'charity' && <span className="badge badge-approved">🟢 يصرف كصدقة</span>}
              {myReview.decision === 'zakat' && <span className="badge badge-committee">🟣 يصرف كزكاة مال</span>}
              {myReview.decision === 'denied' && <span className="badge badge-rejected">🔴 لا يصرف</span>}
              {myReview.decision === 'approved' && <span className="badge badge-approved">🟢 موافق على الصرف</span>}
              {myReview.decision === 'rejected' && <span className="badge badge-rejected">🔴 غير موافق</span>}
              {myReview.decision === 'needs_info' && <span className="badge badge-committee">🟡 يحتاج معلومات إضافية</span>}
            </div>
            {myReview.notes && (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                {myReview.notes}
              </p>
            )}
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
              🔒 حفاظاً على حيادية واستقلالية التقييم، يُعرض رأيك فقط، بينما يستطيع الطبيب المعتمد ومدير النظام الاطلاع على آراء كافة الأعضاء. يمكنك تعديل توصيتك أدناه إن أردت.
            </div>
          </div>
        )
      )}

      {/* The Review Submission Form (For Member or Admin) */}
      {(session.role === 'member' || session.role === 'admin') && (
        <div className="card" style={{ borderTop: '3px solid var(--yellow)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
            ✍️ {myReview ? 'تعديل أو تحديث توصيتك كعضو في اللجنة' : 'تسجيل توصيتك كعضو في اللجنة'} ({session.name})
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '18px' }}>
            🔒 توصيتك تذهب بسرية تامة لمراجعة الطبيب المعتمد ومدير النظام لاتخاذ القرار النهائي.
          </p>

          <form action={submitReviewWithVisit}>
            <div className="form-group">
              <label style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', display: 'block' }}>
                التوصية المقترحة للحالة *
              </label>

              {/* The Exactly Four Recommendation Options */}
              <div className="grid-2">
                {/* 1. يصرف بمال */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '16px 18px',
                    minHeight: '56px',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius)',
                    border: '2px solid rgba(56, 189, 248, 0.4)',
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="paid"
                    required
                    defaultChecked={myReview?.decision === 'paid'}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '1.05rem', display: 'block' }}>
                      🔵 يصرف بمال
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      يتحمل المريض التكلفة أو جزء منها
                    </span>
                  </div>
                </label>

                {/* 2. يصرف كصدقة */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '16px 18px',
                    minHeight: '56px',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius)',
                    border: '2px solid rgba(34, 197, 94, 0.4)',
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="charity"
                    required
                    defaultChecked={myReview?.decision === 'charity'}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '1.05rem', display: 'block' }}>
                      🟢 يصرف كصدقة
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      صرف مجاني من أموال الصدقات
                    </span>
                  </div>
                </label>

                {/* 3. يصرف كزكاة مال */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '16px 18px',
                    minHeight: '56px',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius)',
                    border: '2px solid rgba(168, 85, 247, 0.4)',
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="zakat"
                    required
                    defaultChecked={myReview?.decision === 'zakat'}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <span style={{ fontWeight: 700, color: '#c084fc', fontSize: '1.05rem', display: 'block' }}>
                      🟣 يصرف كزكاة مال
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      الحالة مستحقة لمصارف زكاة المال الشرعية
                    </span>
                  </div>
                </label>

                {/* 4. لا يصرف */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '16px 18px',
                    minHeight: '56px',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius)',
                    border: '2px solid rgba(239, 68, 68, 0.4)',
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="denied"
                    required
                    defaultChecked={myReview?.decision === 'denied'}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--red)', fontSize: '1.05rem', display: 'block' }}>
                      🔴 لا يصرف
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      التوصية بعدم الموافقة على الصرف
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '18px' }}>
              <label style={{ fontSize: '0.92rem', fontWeight: 600 }}>ملاحظات وتوصيات العضو (اختياري)</label>
              <textarea
                name="notes"
                rows={3}
                defaultValue={myReview?.notes || ''}
                placeholder="اكتب أسباب التوصية أو أي ملاحظات اجتماعية تخص الحالة..."
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '14px', marginTop: '24px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ flex: 1, minWidth: '220px', minHeight: '48px', justifyContent: 'center' }}
              >
                ✅ {myReview ? 'حفظ وتحديث التوصية' : 'اعتماد وتسجيل التوصية'}
              </button>
              <Link href={`/visits/${visit.id}`} className="btn btn-outline" style={{ minWidth: '120px', minHeight: '48px', justifyContent: 'center' }}>
                إلغاء
              </Link>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
