import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PrintTriggerButton from '@/components/PrintTriggerButton'

export default async function VisitPrintPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div>
      {/* Top Toolbar (Hidden on Print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <PrintTriggerButton />
          <Link href={`/visits/${visit.id}`} className="btn btn-outline">
            ← رجوع لصفحة الزيارة
          </Link>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          يمكنك الضغط على زر "طباعة / حفظ كـ PDF" واختيار (Save as PDF) لحفظ الملف بجودة عالية.
        </span>
      </div>

      {/* Official Medical Report Paper */}
      <div className="print-paper">
        {/* Header */}
        <div className="print-header">
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#111827' }}>
              🏥 مجمع العيادات الطبية التخصصي
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#4b5563' }}>
              قسم الرعاية الاجتماعية والصيدلية الخيرية
            </p>
          </div>
          <div style={{ textAlign: 'left', direction: 'ltr' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#4f46e5' }}>{visit.patient.patientId}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Visit #{visit.id}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{new Date(visit.createdAt).toLocaleDateString('ar-EG')}</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '16px 0', padding: '6px', background: '#f3f4f6', borderRadius: '4px', fontWeight: 700, fontSize: '1.1rem' }}>
          تقرير حالة طبية وقرار صرف الدواء
        </div>

        {/* Patient Details Box */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px', background: '#f9fafb' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: '#1f2937' }}>
            👤 بيانات المريض
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.85rem' }}>
            <div><strong>الاسم:</strong> {visit.patient.fullName}</div>
            <div><strong>رقم الملف:</strong> {visit.patient.patientId}</div>
            <div><strong>الهاتف:</strong> {visit.patient.phone || '—'}</div>
            <div><strong>السن / الميلاد:</strong> {visit.patient.birthDate || '—'}</div>
            <div><strong>الجنس:</strong> {visit.patient.gender || '—'}</div>
            <div><strong>المحافظة / المدينة:</strong> {[visit.patient.governorate, visit.patient.city].filter(Boolean).join(' - ') || '—'}</div>
            <div><strong>الحالة الاجتماعية:</strong> {visit.patient.maritalStatus || '—'}</div>
            <div><strong>الحالة المادية:</strong> {visit.patient.financialStatus || '—'}</div>
            <div><strong>العنوان:</strong> {visit.patient.address || '—'}</div>
          </div>
        </div>

        {/* Clinical Info */}
        <div style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
            <div><strong>التخصص الطبي:</strong> {visit.specialty}</div>
            <div><strong>الحالة العامة:</strong> {visit.generalCondition || 'مستقرة'}</div>
          </div>
          {visit.diagnosis && (
            <div style={{ marginBottom: '6px' }}><strong>التشخيص الطبي:</strong> {visit.diagnosis}</div>
          )}
          {visit.description && (
            <div><strong>وصف الحالة والأعراض:</strong> {visit.description}</div>
          )}
        </div>

        {/* Prescription Table */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: '#1f2937' }}>
            💊 الروشتة الطبية المعتمدة
          </h3>
          <table>
            <thead>
              <tr>
                <th>م</th>
                <th>اسم الدواء والتركيز</th>
                <th>الجرعة والتكرار</th>
                <th>مدة العلاج</th>
                <th>طريقة الاستخدام</th>
                <th>الكمية المقررة</th>
              </tr>
            </thead>
            <tbody>
              {visit.medications.map((m, idx) => (
                <tr key={m.id}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{m.name} {m.concentration || ''}</td>
                  <td>{[m.dosage, m.frequency].filter(Boolean).join(' • ') || '—'}</td>
                  <td>{m.duration || '—'}</td>
                  <td>{m.usageMethod || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{m.quantity || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Committee Opinions Summary */}
        {visit.committeeReviews.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: '#1f2937' }}>
              👥 توصيات ومراجعات أعضاء اللجنة الطبية
            </h3>
            <table>
              <thead>
                <tr>
                  <th>عضو اللجنة</th>
                  <th>الرأي والتوصية</th>
                  <th>الملاحظات</th>
                  <th>التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody>
                {visit.committeeReviews.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.user.name}</td>
                    <td>
                      {r.decision === 'approved' ? '🟢 موافق على الصرف' :
                       r.decision === 'rejected' ? '🔴 غير موافق' : '🟡 يحتاج معلومات إضافية'}
                    </td>
                    <td>{r.notes || '—'}</td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(r.createdAt).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Final Decision Box */}
        {visit.finalDecision ? (
          <div style={{ border: '2px solid #10b981', borderRadius: '6px', padding: '14px 16px', background: '#ecfdf5', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#065f46' }}>
                ⚖️ القرار النهائي المعتمد للصرف
              </h3>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: visit.finalDecision.decisionType === 'denied' ? '#b91c1c' : '#047857' }}>
                {visit.finalDecision.decisionType === 'charity' ? '✅ يصرف كصدقة (مجاناً بالكامل)' :
                 visit.finalDecision.decisionType === 'paid' ? '🔵 يصرف بمقابل مالي' : '❌ لا يصرف (مرفوض)'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.85rem', marginTop: '10px' }}>
              {visit.finalDecision.dispenseDuration && (
                <div><strong>مدة الصرف:</strong> {visit.finalDecision.dispenseDuration}</div>
              )}
              {visit.finalDecision.dispenseQuantity && (
                <div><strong>كمية الصرف:</strong> {visit.finalDecision.dispenseQuantity}</div>
              )}
              {visit.finalDecision.dispenseSchedule && (
                <div><strong>جدول الصرف:</strong> {visit.finalDecision.dispenseSchedule}</div>
              )}
            </div>
            {visit.finalDecision.reason && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                <strong>توجيهات الصيدلية والملاحظات:</strong> {visit.finalDecision.reason}
              </div>
            )}
          </div>
        ) : (
          <div style={{ border: '1px dashed #d1d5db', padding: '12px', textAlign: 'center', color: '#6b7280', marginBottom: '20px' }}>
            الحالة لا تزال قيد المراجعة ولم يتم اعتماد القرار النهائي بعد.
          </div>
        )}

        {/* Signatures & Footer */}
        <div className="print-footer">
          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '40px' }}>
              توقيع الصيدلي المسؤول
            </div>
            <div style={{ borderTop: '1px solid #9ca3af', paddingTop: '4px', fontSize: '0.8rem' }}>
              التوقيع والتاريخ
            </div>
          </div>

          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '40px' }}>
              ختم المجمع الطبي
            </div>
            <div style={{ borderTop: '1px solid #9ca3af', paddingTop: '4px', fontSize: '0.8rem' }}>
              خاتم الإدارة الطبية
            </div>
          </div>

          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '40px' }}>
              الطبيب المسؤول: {visit.finalDecision?.doctorName || 'د. الطبيب المختص'}
            </div>
            <div style={{ borderTop: '1px solid #9ca3af', paddingTop: '4px', fontSize: '0.8rem' }}>
              الاعتماد والتوقيع
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
