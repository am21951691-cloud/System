'use client'

import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface VisitPDFData {
  patient: {
    fullName: string
    patientId: string
    gender?: string | null
    phone?: string | null
    governorate?: string | null
    city?: string | null
  }
  visit: {
    specialty: string
    description?: string | null
    diagnosis?: string | null
    generalCondition?: string | null
    createdAt: string
  }
  medications: {
    name: string
    concentration?: string | null
    dosage?: string | null
    frequency?: string | null
    duration?: string | null
    quantity?: string | null
  }[]
  committeeReviews: {
    userName: string
    decision: string
    notes?: string | null
    createdAt: string
  }[]
  finalDecision?: {
    decisionType: string
    dispenseDuration?: string | null
    dispenseQuantity?: string | null
    dispenseSchedule?: string | null
    doctorName?: string | null
    reason?: string | null
  } | null
}

export function generateVisitPDF(data: VisitPDFData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  doc.setFont('Helvetica')
  let y = 20

  doc.setFontSize(18)
  doc.text(`Report - ${data.patient.patientId}`, 105, y, { align: 'center' })
  y += 12

  doc.setFontSize(12)
  doc.text(`Patient: ${data.patient.fullName}`, 190, y, { align: 'right' })
  y += 7
  doc.text(`ID: ${data.patient.patientId}`, 190, y, { align: 'right' })
  y += 7
  if (data.patient.phone) {
    doc.text(`Phone: ${data.patient.phone}`, 190, y, { align: 'right' })
    y += 7
  }
  y += 5

  doc.setFontSize(14)
  doc.text('Visit Details', 190, y, { align: 'right' })
  y += 7
  doc.setFontSize(11)
  doc.text(`Specialty: ${data.visit.specialty}`, 190, y, { align: 'right' })
  y += 6
  doc.text(`Date: ${data.visit.createdAt}`, 190, y, { align: 'right' })
  y += 6
  if (data.visit.diagnosis) {
    doc.text(`Diagnosis: ${data.visit.diagnosis}`, 190, y, { align: 'right' })
    y += 6
  }
  y += 5

  if (data.medications.length > 0) {
    doc.setFontSize(14)
    doc.text('Prescription', 190, y, { align: 'right' })
    y += 5
    ;(doc as any).autoTable({
      startY: y,
      head: [['Medication', 'Concentration', 'Dosage', 'Frequency', 'Duration', 'Quantity']],
      body: data.medications.map((m) => [
        m.name, m.concentration || '', m.dosage || '',
        m.frequency || '', m.duration || '', m.quantity || '',
      ]),
      styles: { fontSize: 9, halign: 'right' },
      headStyles: { fillColor: [99, 102, 241] },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  if (data.committeeReviews.length > 0) {
    doc.setFontSize(14)
    doc.text('Committee Reviews', 190, y, { align: 'right' })
    y += 5
    ;(doc as any).autoTable({
      startY: y,
      head: [['Member', 'Decision', 'Notes', 'Date']],
      body: data.committeeReviews.map((r) => [
        r.userName, r.decision, r.notes || '', r.createdAt,
      ]),
      styles: { fontSize: 9, halign: 'right' },
      headStyles: { fillColor: [234, 179, 8] },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  if (data.finalDecision) {
    doc.setFontSize(14)
    doc.text('Final Decision', 190, y, { align: 'right' })
    y += 7
    doc.setFontSize(11)
    const decisionLabels: Record<string, string> = {
      charity: 'Charity',
      paid: 'Paid',
      denied: 'Denied',
    }
    doc.text(`Decision: ${decisionLabels[data.finalDecision.decisionType] || data.finalDecision.decisionType}`, 190, y, { align: 'right' })
    y += 6
    if (data.finalDecision.dispenseDuration) {
      doc.text(`Duration: ${data.finalDecision.dispenseDuration}`, 190, y, { align: 'right' })
      y += 6
    }
    if (data.finalDecision.dispenseQuantity) {
      doc.text(`Quantity: ${data.finalDecision.dispenseQuantity}`, 190, y, { align: 'right' })
      y += 6
    }
    if (data.finalDecision.doctorName) {
      doc.text(`Doctor: ${data.finalDecision.doctorName}`, 190, y, { align: 'right' })
    }
  }

  doc.save(`visit-report-${data.patient.patientId}.pdf`)
}
