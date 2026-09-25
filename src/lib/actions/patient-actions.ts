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

export async function createPatient(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const fullName = sanitizeInput(formData.get('fullName'), 150)
  if (!fullName) {
    throw new Error('اسم المريض مطلوب')
  }

  // Generate next PAT-XXXXXX
  const lastPatient = await prisma.patient.findFirst({
    orderBy: { id: 'desc' },
  })
  const nextNum = (lastPatient?.id || 0) + 1
  const patientId = `PAT-${String(nextNum).padStart(6, '0')}`

  // 1. Create Patient
  const patient = await prisma.patient.create({
    data: {
      patientId,
      fullName,
      birthDate: sanitizeInput(formData.get('birthDate'), 50),
      gender: sanitizeInput(formData.get('gender'), 20),
      governorate: sanitizeInput(formData.get('governorate'), 50),
      city: sanitizeInput(formData.get('city'), 50),
      phone: sanitizeInput(formData.get('phone'), 30),
      address: sanitizeInput(formData.get('address'), 500),
      maritalStatus: sanitizeInput(formData.get('maritalStatus'), 30),
      financialStatus: sanitizeInput(formData.get('financialStatus'), 30),
      notes: sanitizeInput(formData.get('notes'), 1000),
    },
  })

  await logAudit(
    session.userId,
    'إنشاء مريض جديد',
    `تم تسجيل المريض ${patient.fullName} برقم ${patientId}`,
    'patient',
    patient.id
  )

  // 2. Create Initial Visit & Prescription
  const specialty = sanitizeInput(formData.get('specialty'), 50) || 'باطنة'
  const description = sanitizeInput(formData.get('description'), 1000)
  const generalCondition = sanitizeInput(formData.get('generalCondition'), 255)
  const diagnosis = sanitizeInput(formData.get('diagnosis'), 500)
  const visitNotes = sanitizeInput(formData.get('visitNotes'), 1000)
  const rawStatus = sanitizeInput(formData.get('targetStatus'), 30)
  const targetStatus = rawStatus === 'new' ? 'new' : 'committee_review'

  const visit = await prisma.visit.create({
    data: {
      patientId: patient.id,
      specialty,
      description,
      generalCondition,
      diagnosis,
      notes: visitNotes,
      status: targetStatus,
    },
  })

  // 3. Create all medications from prescription form
  const medNames = formData.getAll('medName')
  let medsCount = 0

  for (let i = 0; i < medNames.length; i++) {
    const name = sanitizeInput(medNames[i], 150)
    if (!name) continue

    await prisma.medication.create({
      data: {
        visitId: visit.id,
        name,
        concentration: sanitizeInput(formData.getAll('medConcentration')[i], 50),
        dosage: sanitizeInput(formData.getAll('medDosage')[i], 50),
        frequency: sanitizeInput(formData.getAll('medFrequency')[i], 100),
        duration: sanitizeInput(formData.getAll('medDuration')[i], 100),
        usageMethod: sanitizeInput(formData.getAll('medUsage')[i], 150),
        quantity: sanitizeInput(formData.getAll('medQuantity')[i], 150),
      },
    })
    medsCount++
  }

  await logAudit(
    session.userId,
    'إضافة زيارة وروشتة أولية',
    `تم تسجيل زيارة [${specialty}] وروشتة تضم [${medsCount}] دواء للمريض ${patient.fullName}`,
    'visit',
    visit.id
  )

  redirect(`/visits/${visit.id}`)
}
