import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import PrintTriggerButton from '@/components/PrintTriggerButton'

export default async function PatientHistoryPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const isMember = session.role === 'member'
  const isAccountant = session.role === 'accountant'

  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(id) },
    include: {
      visits: {
        orderBy: { createdAt: 'desc' },
        include: {
          medications: !isMember,
          committeeReviews: {
            include: { user: { select: { name: true } } },
          },
          finalDecision: true,
        },
      },
    },
  })

  if (!patient) return notFound()

  return (
    <div>
      {/* Top Toolbar (Hidden on Print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <PrintTriggerButton />
          <Link href={`/patients/${patient.id}`} className="btn btn-outline">
            ← رجوع لملف المريض
          </Link>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>💡 نصيحة: لحفظ ملف التاريخ الطبي كاملاً بصور الروشتات كـ PDF، اضغط "طباعة / حفظ كـ PDF" واختر (Save as PDF) مع التأكد من تفعيل "رسومات الخلفية" (Background Graphics).</span>
        </div>
      </div>

      {/* Official Medical Dossier Paper */}
      <div className="print-paper">
        {/* Header */}
        <div className="print-header">
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#111827' }}>
              🏥 مجمع العيادات الطبية التخصصي
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#4b5563' }}>
              السجل الطبي الكامل للمريض (Medical History Dossier)
            </p>
          </div>
          <div style={{ textAlign: 'left', direction: 'ltr' }}>
            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#4f46e5' }}>{patient.patientId}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>إجمالي الزيارات: {patient.visits.length}</div>
          </div>
        </div>

        {/* Master Patient Info Box */}
        <div style={{ border: '2px solid #3b82f6', borderRadius: '6px', padding: '16px', marginBottom: '24px', background: '#eff6ff' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px', color: '#1e40af' }}>
            📋 البيانات الأساسية الدائمة للمريض
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.9rem' }}>
            <div><strong>الاسم الكامل:</strong> {patient.fullName}</div>
            <div><strong>رقم الملف:</strong> {patient.patientId}</div>
            <div><strong>رقم الهاتف:</strong> {patient.phone || '—'}</div>
            <div><strong>السن / تاريخ الميلاد:</strong> {patient.birthDate || '—'}</div>
            <div><strong>الجنس:</strong> {patient.gender || '—'}</div>
            <div><strong>المحافظة / المدينة:</strong> {[patient.governorate, patient.city].filter(Boolean).join(' - ') || '—'}</div>
            <div><strong>الحالة الاجتماعية:</strong> {patient.maritalStatus || '—'}</div>
            <div><strong>اسم الزوج / الزوجة:</strong> {patient.spouseName || '—'}</div>
            <div><strong>الحالة المادية:</strong> {patient.financialStatus || '—'}</div>
            <div><strong>العنوان:</strong> {patient.address || '—'}</div>
          </div>
          {patient.notes && (
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #bfdbfe', fontSize: '0.85rem' }}>
              <strong>ملاحظات عامة حول المريض:</strong> {patient.notes}
            </div>
          )}
        </div>

        {/* Visits & Medical History Section */}
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px', borderBottom: '2px solid #111827', paddingBottom: '6px' }}>
          📑 سجل وتاريخ كافة الزيارات والحالات والقرارات
        </h2>

        {patient.visits.length === 0 ? (
          <p style={{ color: '#6b7280', padding: '20px', textAlign: 'center' }}>لا توجد زيارات مسجلة للمريض حتى الآن.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {patient.visits.map((v, index) => (
              <div
                key={v.id}
                style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '16px',
                  background: '#ffffff',
                  pageBreakInside: 'avoid',
                }}
              >
                {/* Visit Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
                    زيارة رقم ({patient.visits.length - index}) — {v.specialty}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                    التاريخ: {new Date(v.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>

                {/* Clinical Notes (Redacted for Accountant) */}
                <div style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                  <div>
                    <strong>التشخيص:</strong>{' '}
                    {isAccountant ? <span style={{ fontStyle: 'italic', color: '#6b7280' }}>🔒 محجوب (صلاحية محاسب)</span> : (v.diagnosis || '—')}
                  </div>
                  <div>
                    <strong>الحالة العامة:</strong>{' '}
                    {isAccountant ? <span style={{ fontStyle: 'italic', color: '#6b7280' }}>🔒 محجوب (صلاحية محاسب)</span> : (v.generalCondition || 'مستقرة')}
                  </div>
                  {!isAccountant && v.description && (
                    <div style={{ marginTop: '4px' }}><strong>الوصف:</strong> {v.description}</div>
                  )}
                </div>

                {/* Prescription Image (Hidden for Accountant) */}
                {!isAccountant && v.prescriptionImage && (
                  <div className="prescription-print-box" style={{ margin: '12px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1f2937' }}>
                        📷 صورة الروشتة الطبية المرفقة بالحالة
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>مستند أصلي</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={v.prescriptionImage}
                        alt="صورة الروشتة المرفقة"
                        className="prescription-print-img"
                        style={{ maxHeight: '380px' }}
                        loading="eager"
                      />
                    </div>
                  </div>
                )}

                {/* Medications Table (Strictly hidden for committee members) */}
                {!isMember && v.medications && v.medications.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>💊 الأدوية المعتمدة للصرف:</div>
                    <table>
                      <thead>
                        <tr>
                          <th>الدواء والتركيز</th>
                          {!isAccountant && <th>الجرعة والتكرار</th>}
                          <th>المدة</th>
                          <th>الكمية المقررة</th>
                          <th>فترة الصرف الدوري</th>
                        </tr>
                      </thead>
                      <tbody>
                        {v.medications.map((m) => (
                          <tr key={m.id}>
                            <td style={{ fontWeight: 600 }}>{m.name} {m.concentration || ''}</td>
                            {!isAccountant && <td>{[m.dosage, m.frequency].filter(Boolean).join(' • ') || '—'}</td>}
                            <td>{m.duration || '—'}</td>
                            <td style={{ fontWeight: 700, color: '#047857' }}>{m.quantity || m.totalQuantity || '—'}</td>
                            <td>{m.dispenseInterval || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Decision Box */}
                {v.finalDecision ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '8px 12px', fontSize: '0.85rem', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ color: (v.finalDecision.decisionType === 'rejected' || v.finalDecision.decisionType === 'denied') ? '#dc2626' : '#16a34a' }}>
                        القرار:{' '}
                        {v.finalDecision.decisionType === 'approved' ? '🟢 يستحق الصرف (موافقة)' :
                         v.finalDecision.decisionType === 'charity' ? '🟢 صرف كصدقة' :
                         v.finalDecision.decisionType === 'paid' ? '🔵 صرف بمقابل' : '🔴 لا يصرف (مرفوض)'}
                      </strong>
                      <span style={{ color: '#4b5563' }}>الطبيب: {v.finalDecision.doctorName || 'د. المختص'}</span>
                    </div>
                    {(v.finalDecision.dispenseDuration || v.finalDecision.dispenseQuantity || v.finalDecision.dispenseSchedule) && (
                      <div style={{ color: '#374151', marginTop: '4px' }}>
                        المدة: {v.finalDecision.dispenseDuration || '—'} | الكمية: {v.finalDecision.dispenseQuantity || '—'} | الجدول: {v.finalDecision.dispenseSchedule || '—'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '6px' }}>
                    حالة الزيارة الحالية: قيد المتابعة ({v.status})
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="print-footer">
          <div>
            <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
              تم استخراج التقرير بواسطة: {session.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              نظام إدارة حالات المجمع الطبي
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '30px' }}>
              خاتم إدارة المجمع
            </div>
            <div style={{ borderTop: '1px solid #9ca3af', paddingTop: '4px', fontSize: '0.8rem' }}>
              اعتماد السجلات الطبية
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
