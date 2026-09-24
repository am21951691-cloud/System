'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'

export async function createVisit(patientId: number, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const visit = await prisma.visit.create({
    data: {
      patientId,
      specialty: formData.get('specialty') as string,
      description: (formData.get('description') as string) || null,
      generalCondition: (formData.get('generalCondition') as string) || null,
      diagnosis: (formData.get('diagnosis') as string) || null,
      notes: (formData.get('notes') as string) || null,
    },
  })

  const medNames = formData.getAll('medName')
  for (let i = 0; i < medNames.length; i++) {
    const name = medNames[i] as string
    if (!name.trim()) continue

    await prisma.medication.create({
      data: {
        visitId: visit.id,
        name,
        concentration: (formData.getAll('medConcentration')[i] as string) || null,
        dosage: (formData.getAll('medDosage')[i] as string) || null,
        frequency: (formData.getAll('medFrequency')[i] as string) || null,
        duration: (formData.getAll('medDuration')[i] as string) || null,
        usageMethod: (formData.getAll('medUsage')[i] as string) || null,
        quantity: (formData.getAll('medQuantity')[i] as string) || null,
      },
    })
  }

  await logAudit(
    session.userId,
    'إضافة زيارة جديدة',
    `تم إضافة زيارة ${visit.specialty} للمريض`,
    'visit',
    visit.id
  )

  redirect(`/visits/${visit.id}`)
}

export async function sendToCommittee(visitId: number) {
  const session = await getSession()
  if (!session) redirect('/login')

  await prisma.visit.update({
    where: { id: visitId },
    data: { status: 'committee_review' },
  })

  await logAudit(
    session.userId,
    'إرسال الحالة للجنة',
    `تم إرسال الزيارة رقم ${visitId} للجنة`,
    'visit',
    visitId
  )

  redirect(`/visits/${visitId}`)
}

export async function sendToDoctor(visitId: number) {
  const session = await getSession()
  if (!session) redirect('/login')

  await prisma.visit.update({
    where: { id: visitId },
    data: { status: 'doctor_review' },
  })

  await logAudit(
    session.userId,
    'إرسال الحالة للطبيب',
    `تم إرسال الزيارة رقم ${visitId} للطبيب`,
    'visit',
    visitId
  )

  redirect(`/visits/${visitId}`)
}
