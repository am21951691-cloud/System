'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'

export async function submitFinalDecision(visitId: number, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const decisionType = formData.get('decisionType') as string

  await prisma.finalDecision.create({
    data: {
      visitId,
      decisionType,
      dispenseDuration: (formData.get('dispenseDuration') as string) || null,
      dispenseQuantity: (formData.get('dispenseQuantity') as string) || null,
      dispenseSchedule: (formData.get('dispenseSchedule') as string) || null,
      reason: (formData.get('reason') as string) || null,
      doctorName: session.name,
    },
  })

  const newStatus = decisionType === 'denied' ? 'rejected' : 'approved'
  await prisma.visit.update({
    where: { id: visitId },
    data: { status: newStatus },
  })

  await logAudit(
    session.userId,
    'اعتماد القرار النهائي',
    `${session.name} اعتمد القرار: ${decisionType}`,
    'visit',
    visitId
  )

  redirect(`/visits/${visitId}`)
}
