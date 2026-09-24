'use client'

export default function PrintTriggerButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn btn-primary"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', fontWeight: 700 }}
    >
      🖨️ طباعة / حفظ كـ PDF
    </button>
  )
}
