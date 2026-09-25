'use client'

export default function PrintTriggerButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn btn-primary btn-lg"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
    >
      🖨️ طباعة / حفظ كـ PDF
    </button>
  )
}
