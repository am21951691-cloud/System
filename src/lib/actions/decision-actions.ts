'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'

export async function submitFinalDecision(visitId: number, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  if (session.role !== 'doctor' && session.role !== 'admin') {
    throw new Error('غير مصرح لك باعتماد القرار النهائي - هذه الصلاحية للطبيب المعتمد أو مدير النظام فقط')
  }

  const decisionType = String(formData.get('decisionType') || '').trim()
  const allowedDecisions = ['charity', 'paid', 'denied']
  if (!allowedDecisions.includes(decisionType)) {
    throw new Error('نوع القرار غير صالح')
  }

  const dispenseDuration = (formData.get('dispenseDuration') as string)?.trim() || null
  const dispenseQuantity = (formData.get('dispenseQuantity') as string)?.trim() || null
  const dispenseSchedule = (formData.get('dispenseSchedule') as string)?.trim() || null
  const reason = (formData.get('reason') as string)?.trim() || null

  await prisma.finalDecision.upsert({
    where: { visitId },
    create: {
      visitId,
      decisionType,
      dispenseDuration,
      dispenseQuantity,
      dispenseSchedule,
      reason,
      doctorName: session.name,
    },
    update: {
      decisionType,
      dispenseDuration,
      dispenseQuantity,
      dispenseSchedule,
      reason,
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
    `${session.name} اعتمد القرار: [${decisionType}] للزيارة رقم #${visitId}`,
    'visit',
    visitId
  )

  redirect(`/visits/${visitId}`)
}
