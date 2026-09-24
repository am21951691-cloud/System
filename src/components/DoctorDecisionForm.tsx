'use client'

import { useState } from 'react'
import { submitFinalDecision } from '@/lib/actions/decision-actions'

export default function DoctorDecisionForm({ visitId }: { visitId: number }) {
  const [decisionType, setDecisionType] = useState<string>('charity')

  return (
    <form action={submitFinalDecision.bind(null, visitId)}>
      <div className="form-group">
        <label style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
          حدد القرار النهائي لصرف الدواء *
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: `2px solid ${decisionType === 'charity' ? 'var(--green)' : 'var(--border)'}`,
              background: decisionType === 'charity' ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-input)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="radio"
              name="decisionType"
              value="charity"
              checked={decisionType === 'charity'}
              onChange={() => setDecisionType('charity')}
              style={{ display: 'none' }}
              required
            />
            <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🟢</span>
            <strong style={{ color: 'var(--green)', fontSize: '1rem' }}>يصرف كصدقة</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>مجاني بالكامل على نفقة المجمع</span>
          </label>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: `2px solid ${decisionType === 'paid' ? '#38bdf8' : 'var(--border)'}`,
              background: decisionType === 'paid' ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-input)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="radio"
              name="decisionType"
              value="paid"
              checked={decisionType === 'paid'}
              onChange={() => setDecisionType('paid')}
              style={{ display: 'none' }}
              required
            />
            <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🔵</span>
            <strong style={{ color: '#38bdf8', fontSize: '1rem' }}>يصرف بمقابل مالي</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>يتحمل المريض التكلفة أو جزء منها</span>
          </label>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: `2px solid ${decisionType === 'denied' ? 'var(--red)' : 'var(--border)'}`,
              background: decisionType === 'denied' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-input)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="radio"
              name="decisionType"
              value="denied"
              checked={decisionType === 'denied'}
              onChange={() => setDecisionType('denied')}
              style={{ display: 'none' }}
              required
            />
            <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🔴</span>
            <strong style={{ color: 'var(--red)', fontSize: '1rem' }}>لا يصرف (رفض)</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>عدم الموافقة على صرف هذه الروشتة</span>
          </label>
        </div>
      </div>

      {(decisionType === 'charity' || decisionType === 'paid') && (
        <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', margin: '16px 0', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
            📦 تفاصيل وجدولة الصرف
          </h3>
          <div className="grid-3">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>مدة الصرف</label>
              <input name="dispenseDuration" placeholder="مثال: 6 شهور، شهر واحد" defaultValue="شهر واحد" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>كمية الصرف</label>
              <input name="dispenseQuantity" placeholder="مثال: علبة واحدة شهرياً، 3 أشرطة" defaultValue="علبة واحدة شهرياً" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>جدول الصرف</label>
              <input name="dispenseSchedule" placeholder="مثال: كل أول شهر، كل 10 أيام" defaultValue="أول كل شهر" />
            </div>
          </div>
        </div>
      )}

      <div className="form-group" style={{ marginTop: '16px' }}>
        <label>سبب القرار / ملاحظات الطبيب وتوجيهات الصيدلية</label>
        <textarea
          name="reason"
          rows={3}
          placeholder="اكتب أسباب القرار أو أي توجيهات خاصة بالصرف أو المتابعة الطبية..."
        ></textarea>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          type="submit"
          className={decisionType === 'denied' ? 'btn btn-red' : 'btn btn-green'}
          style={{ padding: '12px 36px', fontSize: '1rem', fontWeight: 700 }}
        >
          {decisionType === 'denied' ? '🔴 اعتماد رفض الصرف' : '✅ اعتماد القرار النهائي للصرف'}
        </button>
      </div>
    </form>
  )
}
