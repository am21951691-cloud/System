import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import DoctorDecisionForm from '@/components/DoctorDecisionForm'
import PrescriptionImageViewer from '@/components/PrescriptionImageViewer'
import LiveCommitteeReviews from '@/components/LiveCommitteeReviews'

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
      finalDecision: true,
    },
  })

  if (!visit) return notFound()

  // Strict Quorum Enforcement:
  // Must have at least 2 distinct committee reviews before doctor can finalize decision
  if (visit.committeeReviews.length < 2 && visit.status !== 'approved' && visit.status !== 'rejected') {
    redirect(`/visits/${visit.id}?error=quorum`)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>⚖️ إصدار القرار النهائي للطبيب المعتمد</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            المريض: {visit.patient.fullName} ({visit.patient.patientId}) — زيارة {visit.specialty}
          </p>
        </div>
        <Link href={`/visits/${visit.id}`} className="btn btn-outline">
          ← عودة لتفاصيل الزيارة
        </Link>
      </div>

      {/* Case Details, Prescription & Live Committee Reviews */}
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

          {/* Previous/Existing Medications preview */}
          {visit.medications.length > 0 && (
            <div style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                💊 الأدوية المفرغة حالياً ({visit.medications.length}) — يمكنك تعديلها أو الإضافة عليها بالأسفل
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>الدواء</th>
                      <th>الجرعة والتكرار</th>
                      <th>المدة</th>
                      <th>الكمية المقررة</th>
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
            </div>
          )}
        </div>

        {/* Live Committee Reviews with Real-time Polling & Sync */}
        <LiveCommitteeReviews
          visitId={visit.id}
          initialReviews={visit.committeeReviews.map((r) => ({
            id: r.id,
            userId: r.userId,
            decision: r.decision,
            notes: r.notes,
            createdAt: r.createdAt.toISOString(),
            user: {
              name: r.user.name,
            },
          }))}
        />
      </div>

      {/* Decision Form Card with Dynamic Medication Entry */}
      <div className="card" style={{ borderTop: '3px solid var(--green)' }}>
        <DoctorDecisionForm
          visitId={visit.id}
          initialDecisionType={visit.finalDecision?.decisionType || 'approved'}
          initialReason={visit.finalDecision?.reason}
          initialDuration={visit.finalDecision?.dispenseDuration}
          initialQuantity={visit.finalDecision?.dispenseQuantity}
          initialSchedule={visit.finalDecision?.dispenseSchedule}
          existingMedications={visit.medications}
        />
      </div>
    </>
  )
}
