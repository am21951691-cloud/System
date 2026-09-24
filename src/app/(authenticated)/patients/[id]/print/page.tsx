import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PrintTriggerButton from '@/components/PrintTriggerButton'

export default async function PatientHistoryPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return null

  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(id) },
    include: {
      visits: {
        orderBy: { createdAt: 'desc' },
        include: {
          medications: true,
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
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <PrintTriggerButton />
          <Link href={`/patients/${patient.id}`} className="btn btn-outline">
            ← رجوع لملف المريض
          </Link>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          ملف التاريخ الطبي الكامل للمريض جاهز للطباعة أو التصدير كـ PDF.
        </span>
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

                {/* Clinical Notes */}
                <div style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                  {v.diagnosis && <div><strong>التشخيص:</strong> {v.diagnosis}</div>}
                  {v.generalCondition && <div><strong>الحالة العامة:</strong> {v.generalCondition}</div>}
                  {v.description && <div><strong>الوصف:</strong> {v.description}</div>}
                </div>

                {/* Medications Table */}
                {v.medications.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>💊 الأدوية الموصوفة:</div>
                    <table>
                      <thead>
                        <tr>
                          <th>الدواء والتركيز</th>
                          <th>الجرعة والتكرار</th>
                          <th>المدة</th>
                          <th>الكمية المقررة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {v.medications.map((m) => (
                          <tr key={m.id}>
                            <td style={{ fontWeight: 600 }}>{m.name} {m.concentration || ''}</td>
                            <td>{[m.dosage, m.frequency].filter(Boolean).join(' • ') || '—'}</td>
                            <td>{m.duration || '—'}</td>
                            <td>{m.quantity || '—'}</td>
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
                      <strong style={{ color: v.finalDecision.decisionType === 'denied' ? '#dc2626' : '#16a34a' }}>
                        القرار: {v.finalDecision.decisionType === 'charity' ? '🟢 صرف كصدقة' : v.finalDecision.decisionType === 'paid' ? '🔵 صرف بمقابل' : '🔴 لم يصرف'}
                      </strong>
                      <span style={{ color: '#4b5563' }}>الطبيب: {v.finalDecision.doctorName || 'د. المختص'}</span>
                    </div>
                    {(v.finalDecision.dispenseDuration || v.finalDecision.dispenseQuantity) && (
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
