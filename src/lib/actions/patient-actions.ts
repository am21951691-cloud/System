'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'

export async function createPatient(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  // Generate next PAT-XXXXXX
  const lastPatient = await prisma.patient.findFirst({
    orderBy: { id: 'desc' },
  })
  const nextNum = (lastPatient?.id || 0) + 1
  const patientId = `PAT-${String(nextNum).padStart(6, '0')}`

  const fullName = (formData.get('fullName') as string)?.trim()
  if (!fullName) {
    throw new Error('اسم المريض مطلوب')
  }

  // 1. Create Patient
  const patient = await prisma.patient.create({
    data: {
      patientId,
      fullName,
      birthDate: (formData.get('birthDate') as string)?.trim() || null,
      gender: (formData.get('gender') as string)?.trim() || null,
      governorate: (formData.get('governorate') as string)?.trim() || null,
      city: (formData.get('city') as string)?.trim() || null,
      phone: (formData.get('phone') as string)?.trim() || null,
      address: (formData.get('address') as string)?.trim() || null,
      maritalStatus: (formData.get('maritalStatus') as string)?.trim() || null,
      financialStatus: (formData.get('financialStatus') as string)?.trim() || null,
      notes: (formData.get('notes') as string)?.trim() || null,
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
  const specialty = (formData.get('specialty') as string)?.trim() || 'باطنة'
  const description = (formData.get('description') as string)?.trim() || null
  const generalCondition = (formData.get('generalCondition') as string)?.trim() || null
  const diagnosis = (formData.get('diagnosis') as string)?.trim() || null
  const visitNotes = (formData.get('visitNotes') as string)?.trim() || null
  const targetStatus = (formData.get('targetStatus') as string) || 'committee_review'

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
    const name = String(medNames[i] || '').trim()
    if (!name) continue

    await prisma.medication.create({
      data: {
        visitId: visit.id,
        name,
        concentration: (formData.getAll('medConcentration')[i] as string)?.trim() || null,
        dosage: (formData.getAll('medDosage')[i] as string)?.trim() || null,
        frequency: (formData.getAll('medFrequency')[i] as string)?.trim() || null,
        duration: (formData.getAll('medDuration')[i] as string)?.trim() || null,
        usageMethod: (formData.getAll('medUsage')[i] as string)?.trim() || null,
        quantity: (formData.getAll('medQuantity')[i] as string)?.trim() || null,
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
