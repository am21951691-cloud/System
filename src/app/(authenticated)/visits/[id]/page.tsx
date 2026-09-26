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

  // Confidentiality: Only doctor and admin can see all members' opinions
  const canSeeAllReviews = session.role === 'doctor' || session.role === 'admin'
  const myReview = visit.committeeReviews.find((r) => r.userId === session.userId)

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

      {/* Basic Visit Information */}
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

      {/* Uploaded Prescription Image Viewer */}
      {visit.prescriptionImage && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📷</span>
            <span>صورة الروشتة المرفقة</span>
          </h2>
          <PrescriptionImageViewer imageUrl={visit.prescriptionImage} title={`روشتة زيارة: ${visit.patient.fullName}`} />
        </div>
      )}

      {/* Prescription Medications Table */}
      {visit.medications.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>💊 الأدوية المفرغة بالروشتة</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>الدواء</th>
                  <th>التركيز</th>
                  <th>الجرعة</th>
                  <th>عدد المرات</th>
                  <th>مدة العلاج</th>
                  <th>الكمية المقررة</th>
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

      {/* Committee Reviews Section (Respecting confidentiality: only doctor & admin see all) */}
      {canSeeAllReviews ? (
        visit.committeeReviews.length > 0 && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📋</span>
                <span>مراجعات وآراء أعضاء اللجنة ({visit.committeeReviews.length})</span>
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                🔒 معروضة بالكامل لمدير النظام والطبيب المعتمد
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visit.committeeReviews.map((review) => (
                <div key={review.id} style={{
                  padding: '14px 16px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
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
                      {review.decision === 'approved' ? '🟢 موافق على الصرف' : review.decision === 'rejected' ? '🔴 غير موافق على الصرف' : '🟡 يحتاج معلومات إضافية'}
                    </span>
                  </div>
                  {review.notes && (
                    <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '4px' }}>
                      <strong>ملاحظات العضو:</strong> {review.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* Regular member view: only see their own submitted review */
        myReview && (
          <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--green)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '1rem', margin: 0, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✅</span>
                <span>رأيك المسجل كعضو لجنة</span>
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {new Date(myReview.createdAt).toLocaleDateString('ar-EG')}
              </span>
            </div>
            <div>
              <span className={`badge ${myReview.decision === 'approved' ? 'badge-approved' : myReview.decision === 'rejected' ? 'badge-rejected' : 'badge-committee'}`}>
                {myReview.decision === 'approved' ? '🟢 موافق على الصرف' : myReview.decision === 'rejected' ? '🔴 غير موافق على الصرف' : '🟡 يحتاج معلومات إضافية'}
              </span>
            </div>
            {myReview.notes && (
              <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {myReview.notes}
              </div>
            )}
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              🔒 تم حفظ رأيك بنجاح، وهو معروض للطبيب المعتمد ومدير النظام لاتخاذ القرار النهائي.
            </div>
          </div>
        )
      )}

      {/* Final Decision Card */}
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
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>السبب / توجيهات الصرف</div>
              <div>{visit.finalDecision.reason}</div>
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
            <Link href={`/visits/${visit.id}/committee`} className="btn btn-yellow btn-lg" style={{ flex: 1, minWidth: '200px', justifyContent: 'center' }}>
              ✍️ تسجيل رأي اللجنة الطبية
            </Link>
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
              ⚖️ إصدار واعتماد القرار النهائي للصرف
            </Link>
          ) : (
            <div style={{ flex: 1, padding: '12px 18px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-secondary)' }}>
              🩺 الحالة بانتظار اتخاذ القرار النهائي من الطبيب المعتمد
            </div>
          )
        )}

        {(visit.status === 'approved' || visit.status === 'rejected') && (session.role === 'doctor' || session.role === 'admin') && (
          <Link href={`/visits/${visit.id}/decision`} className="btn btn-outline" style={{ minWidth: '180px', justifyContent: 'center' }}>
            ✏️ تعديل القرار النهائي
          </Link>
        )}
      </div>
    </>
  )
}
