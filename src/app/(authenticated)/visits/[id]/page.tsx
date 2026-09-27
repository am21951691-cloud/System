import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { sendToCommittee, sendToDoctor } from '@/lib/actions/visit-actions'
import PrescriptionImageViewer from '@/components/PrescriptionImageViewer'

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return redirect('/login')

  const isMember = session.role === 'member'
  const isAccountant = session.role === 'accountant'
  const canSeeAllReviews = session.role === 'doctor' || session.role === 'admin'

  // Defense-in-depth: Strictly exclude medications for committee members at database query level
  const visit = await prisma.visit.findUnique({
    where: { id: parseInt(id) },
    include: {
      patient: true,
      medications: !isMember,
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

  const myReview = visit.committeeReviews.find((r) => r.userId === session.userId)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>📄 تفاصيل الزيارة</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            المريض: {visit.patient.fullName} ({visit.patient.patientId}) — {visit.specialty}
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

      {/* Basic Visit Information (Redacting clinical fields for accountant) */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1rem', margin: 0 }}>بيانات الزيارة</h2>
          <StatusBadge status={visit.status} />
        </div>

        <div className="grid-3">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>التخصص</div>
            <div style={{ fontWeight: 600 }}>{visit.specialty}</div>
          </div>

          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>التشخيص الطبي</div>
            <div>
              {isAccountant ? (
                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  🔒 محجوب (صلاحية محاسب)
                </span>
              ) : (
                visit.diagnosis || '—'
              )}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>الحالة العامة</div>
            <div>
              {isAccountant ? (
                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  🔒 محجوب (صلاحية محاسب)
                </span>
              ) : (
                visit.generalCondition || '—'
              )}
            </div>
          </div>
        </div>

        {/* Clinical description is hidden for accountant */}
        {!isAccountant && visit.description && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>وصف الحالة وتفاصيل الكشف</div>
            <div style={{ fontSize: '0.9rem', lineHeight: '1.7' }}>{visit.description}</div>
          </div>
        )}
      </div>

      {/* Uploaded Prescription Image Viewer (Hidden for accountant to prevent viewing clinical notes) */}
      {!isAccountant && visit.prescriptionImage && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📷</span>
            <span>صورة الروشتة المرفقة</span>
          </h2>
          <PrescriptionImageViewer imageUrl={visit.prescriptionImage} title={`روشتة زيارة: ${visit.patient.fullName}`} />
        </div>
      )}

      {/* Prescription Medications Table (Strictly hidden for committee members) */}
      {!isMember && visit.medications && visit.medications.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💊</span>
              <span>الأدوية المفرغة والمعتمدة للصرف ({visit.medications.length})</span>
            </h2>
            {isAccountant && (
              <span style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>
                💰 عرض كميات الصرف المالي والجدولة
              </span>
            )}
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>الدواء</th>
                  <th>التركيز</th>
                  {!isAccountant && <th>الجرعة والتكرار</th>}
                  <th>المدة</th>
                  <th>الكمية المقررة</th>
                  <th>فترة الصرف الدوري</th>
                  {visit.medications.some((m) => m.notes) && <th>ملاحظات</th>}
                </tr>
              </thead>
              <tbody>
                {visit.medications.map((med) => (
                  <tr key={med.id}>
                    <td style={{ fontWeight: 600 }}>{med.name}</td>
                    <td>{med.concentration || '—'}</td>
                    {!isAccountant && (
                      <td>{[med.dosage, med.frequency, med.usageMethod].filter(Boolean).join(' • ') || '—'}</td>
                    )}
                    <td>{med.duration || '—'}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      {med.quantity || med.totalQuantity || '—'}
                    </td>
                    <td>{med.dispenseInterval || '—'}</td>
                    {visit.medications.some((m) => m.notes) && (
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{med.notes || '—'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Committee Reviews Section (Confidentiality: only Doctor & Admin see all, Member sees only their own, Accountant sees financial verdict) */}
      {!isAccountant && (
        canSeeAllReviews ? (
          visit.committeeReviews.length > 0 && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>👥</span>
                  <span>توصيات أعضاء اللجنة الطبية ({visit.committeeReviews.length})</span>
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  🔒 معروضة بالكامل لمدير النظام والطبيب المعتمد
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {visit.committeeReviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      padding: '14px 16px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600 }}>{review.user.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {new Date(review.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                    <div>
                      {review.decision === 'paid' && <span className="badge badge-doctor">🔵 يصرف بمال</span>}
                      {review.decision === 'charity' && <span className="badge badge-approved">🟢 يصرف كصدقة</span>}
                      {review.decision === 'zakat' && <span className="badge badge-committee">🟣 يصرف كزكاة مال</span>}
                      {review.decision === 'denied' && <span className="badge badge-rejected">🔴 لا يصرف</span>}
                      {review.decision === 'approved' && <span className="badge badge-approved">🟢 موافق على الصرف</span>}
                      {review.decision === 'rejected' && <span className="badge badge-rejected">🔴 غير موافق على الصرف</span>}
                      {review.decision === 'needs_info' && <span className="badge badge-committee">🟡 يحتاج معلومات إضافية</span>}
                    </div>
                    {review.notes && (
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)',
                          background: 'rgba(255,255,255,0.03)',
                          padding: '8px 12px',
                          borderRadius: '4px',
                        }}
                      >
                        <strong>ملاحظات العضو:</strong> {review.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          /* Regular Member View: Shows only their own review */
          myReview && (
            <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--green)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '1rem', margin: 0, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✅</span>
                  <span>توصيتك المسجلة كعضو لجنة</span>
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(myReview.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
              <div>
                {myReview.decision === 'paid' && <span className="badge badge-doctor">🔵 يصرف بمال</span>}
                {myReview.decision === 'charity' && <span className="badge badge-approved">🟢 يصرف كصدقة</span>}
                {myReview.decision === 'zakat' && <span className="badge badge-committee">🟣 يصرف كزكاة مال</span>}
                {myReview.decision === 'denied' && <span className="badge badge-rejected">🔴 لا يصرف</span>}
                {myReview.decision === 'approved' && <span className="badge badge-approved">🟢 موافق على الصرف</span>}
                {myReview.decision === 'rejected' && <span className="badge badge-rejected">🔴 غير موافق على الصرف</span>}
                {myReview.decision === 'needs_info' && <span className="badge badge-committee">🟡 يحتاج معلومات إضافية</span>}
              </div>
              {myReview.notes && (
                <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {myReview.notes}
                </div>
              )}
              <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                🔒 تم حفظ توصيتك بسرية تامة، وهي معروضة للطبيب المعتمد ومدير النظام لاتخاذ القرار النهائي.
              </div>
            </div>
          )
        )
      )}

      {/* Final Decision Card */}
      {visit.finalDecision && (
        <div className="card" style={{ marginBottom: '24px', borderTop: '3px solid var(--green)' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>⚖️ القرار النهائي للطبيب المعتمد</h2>
          <div className="grid-2">
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>نوع القرار</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {visit.finalDecision.decisionType === 'approved' ? (
                  <span style={{ color: 'var(--green)' }}>🟢 يستحق الصرف (موافقة)</span>
                ) : visit.finalDecision.decisionType === 'rejected' || visit.finalDecision.decisionType === 'denied' ? (
                  <span style={{ color: 'var(--red)' }}>🔴 لا يصرف (رفض)</span>
                ) : visit.finalDecision.decisionType === 'charity' ? (
                  <span style={{ color: 'var(--green)' }}>🟢 خيري (مجاني)</span>
                ) : (
                  <span style={{ color: '#38bdf8' }}>🔵 مدفوع</span>
                )}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>الطبيب المعتمد</div>
              <div style={{ fontWeight: 600 }}>{visit.finalDecision.doctorName || '—'}</div>
            </div>
          </div>

          <div className="grid-3" style={{ marginTop: '14px' }}>
            {visit.finalDecision.dispenseDuration && (
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>مدة الصرف: </span>
                <div style={{ fontWeight: 600 }}>{visit.finalDecision.dispenseDuration}</div>
              </div>
            )}
            {visit.finalDecision.dispenseQuantity && (
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>كمية الصرف: </span>
                <div style={{ fontWeight: 600 }}>{visit.finalDecision.dispenseQuantity}</div>
              </div>
            )}
            {visit.finalDecision.dispenseSchedule && (
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>جدول الصرف: </span>
                <div style={{ fontWeight: 600 }}>{visit.finalDecision.dispenseSchedule}</div>
              </div>
            )}
          </div>

          {/* Reason / Pharmacy instructions (shown if present and not pure internal note) */}
          {visit.finalDecision.reason && (
            <div style={{ marginTop: '14px', padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>
                توجيهات الصرف وملاحظات الصيدلية
              </div>
              <div style={{ fontSize: '0.9rem' }}>{visit.finalDecision.reason}</div>
            </div>
          )}
        </div>
      )}

      {/* Workflow Navigation & Stage Action Buttons */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '8px' }}>
        {visit.status === 'new' && (
          session.role === 'admin' ? (
            <form action={sendToCommitteeWithId} style={{ flex: 1, minWidth: '220px' }}>
              <button type="submit" className="btn btn-yellow btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                📤 إرسال الحالة إلى اللجنة الطبية
              </button>
            </form>
          ) : (
            <div style={{ flex: 1, padding: '12px 18px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-secondary)' }}>
              📝 الحالة مسودة جديدة بانتظار إرسالها للجنة من قبل مدير النظام
            </div>
          )
        )}

        {visit.status === 'committee_review' && (
          <>
            {(session.role === 'member' || session.role === 'admin') && (
              <Link href={`/visits/${visit.id}/committee`} className="btn btn-yellow btn-lg" style={{ flex: 1, minWidth: '200px', justifyContent: 'center' }}>
                ✍️ تسجيل توصية اللجنة الطبية
              </Link>
            )}
            {(session.role === 'doctor' || session.role === 'admin') && (
              <form action={sendToDoctorWithId} style={{ flex: 1, minWidth: '200px' }}>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                  📤 إرسال الحالة إلى الطبيب للاعتماد
                </button>
              </form>
            )}
          </>
        )}

        {visit.status === 'doctor_review' && (
          session.role === 'doctor' || session.role === 'admin' ? (
            <Link href={`/visits/${visit.id}/decision`} className="btn btn-green btn-lg" style={{ flex: 1, minWidth: '240px', justifyContent: 'center' }}>
              ⚖️ إصدار واعتماد القرار النهائي وتفريغ الأدوية
            </Link>
          ) : (
            <div style={{ flex: 1, padding: '12px 18px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-secondary)' }}>
              🩺 الحالة بانتظار اتخاذ القرار النهائي من الطبيب المعتمد
            </div>
          )
        )}

        {(visit.status === 'approved' || visit.status === 'rejected') && (session.role === 'doctor' || session.role === 'admin') && (
          <Link href={`/visits/${visit.id}/decision`} className="btn btn-outline" style={{ minWidth: '180px', justifyContent: 'center' }}>
            ✏️ تعديل القرار النهائي وتفريغ الأدوية
          </Link>
        )}
      </div>
    </>
  )
}
