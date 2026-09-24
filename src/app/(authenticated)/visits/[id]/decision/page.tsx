'use client'

import { useEffect, useState } from 'react'
import { submitFinalDecision } from '@/lib/actions/decision-actions'

export default function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const [visitId, setVisitId] = useState<string>('')
  const [decisionType, setDecisionType] = useState('')

  useEffect(() => {
    params.then(p => setVisitId(p.id))
  }, [params])

  if (!visitId) return <p>جاري التحميل...</p>

  async function handleSubmit(formData: FormData) {
    await submitFinalDecision(parseInt(visitId), formData)
  }

  return (
    <>
      <div className="page-header">
        <h1>⚖️ القرار النهائي</h1>
      </div>

      <div className="card">
        <form action={handleSubmit}>
          <div className="form-group">
            <label>نوع القرار *</label>
            <select
              name="decisionType"
              required
              value={decisionType}
              onChange={(e) => setDecisionType(e.target.value)}
            >
              <option value="">اختر</option>
              <option value="charity">🟢 خيري (مجاني)</option>
              <option value="paid">🔵 مدفوع</option>
              <option value="denied">🔴 رفض</option>
            </select>
          </div>

          {(decisionType === 'charity' || decisionType === 'paid') && (
            <>
              <div className="grid-3">
                <div className="form-group">
                  <label>مدة الصرف</label>
                  <input name="dispenseDuration" placeholder="مثال: 6 شهور" />
                </div>
                <div className="form-group">
                  <label>كمية الصرف</label>
                  <input name="dispenseQuantity" placeholder="مثال: علبة شهرياً" />
                </div>
                <div className="form-group">
                  <label>جدول الصرف</label>
                  <input name="dispenseSchedule" placeholder="مثال: كل أول شهر" />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>سبب / ملاحظات</label>
            <textarea name="reason" rows={3} placeholder="سبب القرار..."></textarea>
          </div>

          <button type="submit" className="btn btn-green">
            ✅ إصدار القرار
          </button>
        </form>
      </div>
    </>
  )
}
