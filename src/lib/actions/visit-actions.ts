'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'

function sanitizeInput(val: unknown, maxLen = 255): string | null {
  if (val === null || val === undefined) return null
  const str = String(val).trim().replace(/\0/g, '')
  return str.length > 0 ? str.slice(0, maxLen) : null
}

export async function createVisit(patientId: number, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const specialty = sanitizeInput(formData.get('specialty'), 100) || 'عام'
  const description = sanitizeInput(formData.get('description'), 1000)
  const generalCondition = sanitizeInput(formData.get('generalCondition'), 255)
  const diagnosis = sanitizeInput(formData.get('diagnosis'), 500)
  const notes = sanitizeInput(formData.get('notes'), 1000)

  const visit = await prisma.visit.create({
    data: {
      patientId,
      specialty,
      description,
      generalCondition,
      diagnosis,
      notes,
    },
  })

  const medNames = formData.getAll('medName')
  const medConcs = formData.getAll('medConcentration')
  const medDosages = formData.getAll('medDosage')
  const medFreqs = formData.getAll('medFrequency')
  const medDurs = formData.getAll('medDuration')
  const medUsages = formData.getAll('medUsage')
  const medQuants = formData.getAll('medQuantity')

  for (let i = 0; i < medNames.length; i++) {
    const rawName = sanitizeInput(medNames[i], 200)
    if (!rawName) continue

    await prisma.medication.create({
      data: {
        visitId: visit.id,
        name: rawName,
        concentration: sanitizeInput(medConcs[i], 100),
        dosage: sanitizeInput(medDosages[i], 100),
        frequency: sanitizeInput(medFreqs[i], 100),
        duration: sanitizeInput(medDurs[i], 100),
        usageMethod: sanitizeInput(medUsages[i], 100),
        quantity: sanitizeInput(medQuants[i], 100),
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
