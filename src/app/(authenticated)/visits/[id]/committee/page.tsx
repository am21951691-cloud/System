import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { submitCommitteeReview } from '@/lib/actions/committee-actions'

export default async function CommitteeReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return null

  const visit = await prisma.visit.findUnique({
    where: { id: parseInt(id) },
    include: { patient: true },
  })

  if (!visit || visit.status !== 'committee_review') return notFound()

  const submitReviewWithVisit = submitCommitteeReview.bind(null, visit.id)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>📋 مراجعة اللجنة</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {visit.patient.fullName} — {visit.specialty}
          </p>
        </div>
        <Link href={`/visits/${visit.id}`} className="btn btn-outline">
          ← العودة
        </Link>
      </div>

      <div className="card">
        <form action={submitReviewWithVisit}>
          <div className="form-group">
            <label>القرار *</label>
            <select name="decision" required>
              <option value="">اختر</option>
              <option value="approved">✅ موافق</option>
              <option value="rejected">❌ رافض</option>
              <option value="needs_info">❓ يحتاج معلومات إضافية</option>
            </select>
          </div>
          <div className="form-group">
            <label>ملاحظات</label>
            <textarea name="notes" rows={4} placeholder="أي ملاحظات إضافية..."></textarea>
          </div>
          <button type="submit" className="btn btn-primary">
            ✅ إرسال المراجعة
          </button>
        </form>
      </div>
    </>
  )
}
