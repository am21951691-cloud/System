'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'

export async function createPatient(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const lastPatient = await prisma.patient.findFirst({
    orderBy: { id: 'desc' },
  })
  const nextNum = (lastPatient?.id || 0) + 1
  const patientId = `PAT-${String(nextNum).padStart(6, '0')}`

  const patient = await prisma.patient.create({
    data: {
      patientId,
      fullName: formData.get('fullName') as string,
      birthDate: (formData.get('birthDate') as string) || null,
      gender: (formData.get('gender') as string) || null,
      governorate: (formData.get('governorate') as string) || null,
      city: (formData.get('city') as string) || null,
      phone: (formData.get('phone') as string) || null,
      address: (formData.get('address') as string) || null,
      maritalStatus: (formData.get('maritalStatus') as string) || null,
      financialStatus: (formData.get('financialStatus') as string) || null,
      notes: (formData.get('notes') as string) || null,
    },
  })

  await logAudit(
    session.userId,
    'إنشاء مريض جديد',
    `تم إنشاء المريض ${patient.fullName} - ${patientId}`,
    'patient',
    patient.id
  )

  redirect(`/patients/${patient.id}`)
}
