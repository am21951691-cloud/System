'use client'

import { generateVisitPDF } from '@/lib/pdf'

interface DownloadPdfButtonProps {
  data: Parameters<typeof generateVisitPDF>[0]
}

export default function DownloadPdfButton({ data }: DownloadPdfButtonProps) {
  return (
    <button
      type="button"
      onClick={() => generateVisitPDF(data)}
      className="btn btn-outline"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
    >
      📄 تحميل تقرير الزيارة (PDF)
    </button>
  )
}
