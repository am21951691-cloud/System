'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { redirect } from 'next/navigation'

interface MedicationInput {
  name: string
  concentration?: string
  dosage?: string
  usageMethod?: string
  frequency?: string
  duration?: string
  dispenseInterval?: string
  quantity?: string
  totalQuantity?: string
  notes?: string
}

function sanitizeInput(val: unknown, maxLen = 255): string | null {
  if (val === null || val === undefined) return null
  const str = String(val).trim().replace(/\0/g, '')
  return str.length > 0 ? str.slice(0, maxLen) : null
}

export async function submitFinalDecision(visitId: number, formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  if (session.role !== 'doctor' && session.role !== 'admin') {
    throw new Error('غير مصرح لك باعتماد القرار النهائي - هذه الصلاحية للطبيب المعتمد أو مدير النظام فقط')
  }

  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
  })

  if (!visit) {
    throw new Error('الزيارة غير موجودة')
  }

  const decisionType = String(formData.get('decisionType') || '').trim()
  if (decisionType !== 'approved' && decisionType !== 'rejected') {
    throw new Error('نوع القرار غير صالح، يجب أن يكون يستحق الصرف (approved) أو لا يصرف (rejected)')
  }

  const dispenseDuration = sanitizeInput(formData.get('dispenseDuration'), 100)
  const dispenseQuantity = sanitizeInput(formData.get('dispenseQuantity'), 100)
  const dispenseSchedule = sanitizeInput(formData.get('dispenseSchedule'), 100)
  const reason = sanitizeInput(formData.get('reason'), 1000)

  // 1. Upsert FinalDecision
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

  // 2. Handle Medications if approved
  // Delete existing medications for this visit first to prevent duplicates
  await prisma.medication.deleteMany({
    where: { visitId },
  })

  let medicationsCount = 0
  if (decisionType === 'approved') {
    const rawMeds = formData.get('medicationsData')
    let medsList: MedicationInput[] = []
    if (typeof rawMeds === 'string' && rawMeds.trim()) {
      try {
        medsList = JSON.parse(rawMeds)
      } catch (err) {
        console.error('Failed to parse medicationsData', err)
      }
    }

    const validMeds = medsList.filter(
      (m) => m && typeof m.name === 'string' && m.name.trim().length > 0
    )

    for (const m of validMeds) {
      await prisma.medication.create({
        data: {
          visitId,
          name: sanitizeInput(m.name, 150)!,
          concentration: sanitizeInput(m.concentration, 100),
          dosage: sanitizeInput(m.dosage, 100),
          usageMethod: sanitizeInput(m.usageMethod, 100),
          frequency: sanitizeInput(m.frequency, 100),
          duration: sanitizeInput(m.duration, 100),
          dispenseInterval: sanitizeInput(m.dispenseInterval, 100),
          quantity: sanitizeInput(m.quantity, 100),
          totalQuantity: sanitizeInput(m.totalQuantity, 100),
          notes: sanitizeInput(m.notes, 500),
        },
      })
    }
    medicationsCount = validMeds.length
  }

  // 3. Update visit status to approved or rejected
  await prisma.visit.update({
    where: { id: visitId },
    data: { status: decisionType },
  })

  // 4. Audit Log
  const decisionLabel = decisionType === 'approved' ? 'يستحق الصرف' : 'لا يستحق الصرف (مرفوض)'
  await logAudit(
    session.userId,
    'اعتماد القرار النهائي',
    `قام الطبيب ${session.name} باعتماد القرار [${decisionLabel}] للزيارة رقم #${visitId} ${
      decisionType === 'approved'
        ? medicationsCount > 0
          ? `مع تفريغ ${medicationsCount} أصناف أدوية وجدولة الصرف`
          : 'بالاعتماد على الروشتة المرفقة وجدولة الصرف'
        : ''
    }`,
    'visit',
    visitId
  )

  redirect(`/visits/${visitId}`)
}
