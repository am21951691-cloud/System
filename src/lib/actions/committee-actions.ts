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

  const review = await prisma.committeeReview.create({
    data: {
      visitId,
      userId: session.userId,
      decision,
      notes: notes || null,
    },
  })

  await logAudit(
    session.userId,
    'إضافة رأي اللجنة',
    `عضو اللجنة ${session.name} أضاف رأيه - ${formData.get('decision')}`,
    'committee_review',
    review.id
  )

  redirect(`/visits/${visitId}`)
}
