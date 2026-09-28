'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function submitCommitteeReview(visitId: number, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  if (session.role !== 'member' && session.role !== 'admin') {
    throw new Error('غير مصرح لك بتسجيل رأي في اللجنة الطبية - هذه الصلاحية لأعضاء اللجنة أو مدير النظام')
  }

  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
  })

  if (!visit) {
    throw new Error('الزيارة غير موجودة')
  }

  // Prevent modifications if visit is already finalized (tamper-proof state locking)
  if (visit.status === 'approved' || visit.status === 'rejected') {
    throw new Error('لا يمكن تسجيل أو تعديل رأي اللجنة بعد اعتماد القرار النهائي للزيارة')
  }

  const decision = String(formData.get('decision') || '').trim()
  const allowedDecisions = ['paid', 'charity', 'zakat', 'denied']
  if (!allowedDecisions.includes(decision)) {
    throw new Error('رأي اللجنة غير صالح، يرجى اختيار أحد الخيارات الأربعة المعتمدة')
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

  const decisionLabels: Record<string, string> = {
    paid: 'يصرف بمال',
    charity: 'يصرف كصدقة',
    zakat: 'يصرف كزكاة مال',
    denied: 'لا يصرف',
  }

  // Check total distinct committee reviews for this visit
  const totalReviews = await prisma.committeeReview.count({
    where: { visitId },
  })

  // Quorum rule: If at least 2 members have given their opinions and visit is in committee_review,
  // automatically advance to doctor_review!
  if (totalReviews >= 2 && visit.status === 'committee_review') {
    await prisma.visit.update({
      where: { id: visitId },
      data: { status: 'doctor_review' },
    })

    await logAudit(
      session.userId,
      'اكتمال نصاب اللجنة وإحالة للطبيب',
      `اكتمل نصاب اللجنة الطبية (${totalReviews} أعضاء سجلوا توصياتهم) للزيارة رقم #${visitId} وتم تحويلها تلقائياً لمراجعة واعتماد الطبيب`,
      'visit',
      visitId
    )
  }

  await logAudit(
    session.userId,
    existing ? 'تعديل رأي اللجنة' : 'إضافة رأي اللجنة',
    `عضو اللجنة ${session.name} ${existing ? 'عدّل' : 'سجل'} توصيته: [${decisionLabels[decision] || decision}] للزيارة رقم #${visitId} (إجمالي توصيات اللجنة: ${totalReviews})${visit.status === 'doctor_review' ? ' - تم إلحاق الرأي أثناء مراجعة الطبيب' : ''}`,
    'committee_review',
    reviewId
  )

  // Invalidate Next.js cache so the doctor and all pages reflect the new opinion immediately
  revalidatePath(`/visits/${visitId}`)
  revalidatePath(`/visits/${visitId}/decision`)
  revalidatePath(`/visits/${visitId}/committee`)
  revalidatePath('/dashboard')

  redirect(`/visits/${visitId}`)
}
