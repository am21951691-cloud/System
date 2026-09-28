'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function sanitizeInput(val: unknown, maxLen = 255): string | null {
  if (val === null || val === undefined) return null
  const str = String(val).trim().replace(/\0/g, '')
  return str.length > 0 ? str.slice(0, maxLen) : null
}

export async function createVisit(patientId: number, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  if (session.role !== 'admin') {
    throw new Error('غير مصرح لك بإضافة زيارة جديدة - هذه الصلاحية لمدير النظام فقط')
  }

  const specialty = sanitizeInput(formData.get('specialty'), 100) || 'عام'
  const description = sanitizeInput(formData.get('description'), 1000)
  const generalCondition = sanitizeInput(formData.get('generalCondition'), 255)
  const diagnosis = sanitizeInput(formData.get('diagnosis'), 500)
  const notes = sanitizeInput(formData.get('notes'), 1000)
  const rawStatus = sanitizeInput(formData.get('targetStatus'), 30)
  const targetStatus = rawStatus === 'new' ? 'new' : 'committee_review'
  const rawImage = formData.get('prescriptionImage')
  const prescriptionImage = typeof rawImage === 'string' && rawImage.startsWith('data:image/') ? rawImage : null

  const visit = await prisma.visit.create({
    data: {
      patientId,
      specialty,
      description,
      generalCondition,
      diagnosis,
      notes,
      prescriptionImage,
      status: targetStatus,
    },
  })

  await logAudit(
    session.userId,
    'إضافة زيارة جديدة',
    `تم إضافة زيارة ${visit.specialty} للمريض مع إرفاق الروشتة`,
    'visit',
    visit.id
  )

  redirect(`/visits/${visit.id}`)
}

export async function sendToCommittee(visitId: number) {
  const session = await getSession()
  if (!session) redirect('/login')

  if (session.role !== 'admin') {
    throw new Error('غير مصرح لك بإرسال الحالة للجنة - هذه الصلاحية لمدير النظام فقط')
  }

  await prisma.visit.update({
    where: { id: visitId },
    data: { status: 'committee_review' },
  })

  await logAudit(
    session.userId,
    'إرسال الحالة للجنة',
    `تم إرسال الزيارة رقم ${visitId} للجنة بواسطة ${session.name}`,
    'visit',
    visitId
  )

  redirect(`/visits/${visitId}`)
}

export async function sendToDoctor(visitId: number) {
  const session = await getSession()
  if (!session) redirect('/login')

  if (session.role !== 'doctor' && session.role !== 'admin') {
    throw new Error('غير مصرح لك بإرسال الحالة للطبيب - هذه الصلاحية للطبيب أو مدير النظام فقط')
  }

  const reviewsCount = await prisma.committeeReview.count({
    where: { visitId },
  })

  if (reviewsCount < 2) {
    throw new Error(
      `لا يمكن تحويل الحالة للطبيب: تم تسجيل رأي ${reviewsCount} عضو فقط. يلزم تسجيل رأي عضوين على الأقل من اللجنة الطبية لاكتمال النصاب.`
    )
  }

  await prisma.visit.update({
    where: { id: visitId },
    data: { status: 'doctor_review' },
  })

  await logAudit(
    session.userId,
    'إرسال الحالة للطبيب',
    `تم إرسال الزيارة رقم ${visitId} للطبيب بواسطة ${session.name} (نصاب اللجنة: ${reviewsCount} أعضاء)`,
    'visit',
    visitId
  )

  revalidatePath(`/visits/${visitId}`)
  revalidatePath(`/visits/${visitId}/decision`)
  revalidatePath('/dashboard')

  redirect(`/visits/${visitId}`)
}
