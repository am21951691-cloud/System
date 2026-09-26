'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'

export async function submitCommitteeReview(visitId: number, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const decision = String(formData.get('decision') || '').trim()
  const allowedDecisions = ['approved', 'rejected', 'needs_info']
  if (!allowedDecisions.includes(decision)) {
    throw new Error('رأي اللجنة غير صالح')
  }

  const notesRaw = formData.get('notes')
  const notes = notesRaw ? String(notesRaw).trim().slice(0, 1000) : null

  // Check if this member has already submitted a review for this visit
  const existing = await prisma.committeeReview.findFirst({
    where: { visitId, userId: session.userId },
  })

  let reviewId: number
  if (existing) {
    const updated = await prisma.committeeReview.update({
      where: { id: existing.id },
      data: {
        decision,
        notes: notes || null,
      },
    })
    reviewId = updated.id
  } else {
    const created = await prisma.committeeReview.create({
      data: {
        visitId,
        userId: session.userId,
        decision,
        notes: notes || null,
      },
    })
    reviewId = created.id
  }

  await logAudit(
    session.userId,
    existing ? 'تعديل رأي اللجنة' : 'إضافة رأي اللجنة',
    `عضو اللجنة ${session.name} ${existing ? 'عدّل' : 'سجل'} رأيه - ${decision === 'approved' ? 'موافق' : decision === 'rejected' ? 'رافض' : 'يحتاج معلومات'}`,
    'committee_review',
    reviewId
  )

  redirect(`/visits/${visitId}`)
}
