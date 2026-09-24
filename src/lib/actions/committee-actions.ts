'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'

export async function submitCommitteeReview(visitId: number, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const review = await prisma.committeeReview.create({
    data: {
      visitId,
      userId: session.userId,
      decision: formData.get('decision') as string,
      notes: (formData.get('notes') as string) || null,
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
