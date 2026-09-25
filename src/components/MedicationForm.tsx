'use client'

import { useState } from 'react'

export default function MedicationForm() {
  const [medications, setMedications] = useState([{ id: 1 }])

  function addMedication() {
    setMedications([...medications, { id: Date.now() }])
  }

  function removeMedication(id: number) {
    if (medications.length <= 1) return
    setMedications(medications.filter((m) => m.id !== id))
  }

  return (
    <div>
      <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>💊 الروشتة</h3>

      {medications.map((med, index) => (
        <div
          key={med.id}
          style={{
            padding: '16px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '12px',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>💊 بيانات الدواء {index + 1}</span>
            {medications.length > 1 && (
              <button
                type="button"
                onClick={() => removeMedication(med.id)}
                className="btn btn-outline"
                style={{
                  color: 'var(--red)',
                  borderColor: 'rgba(244, 63, 94, 0.4)',
                  background: 'rgba(244, 63, 94, 0.08)',
                  padding: '6px 14px',
                  minHeight: '38px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                }}
              >
                ✕ حذف الدواء
              </button>
            )}
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label>اسم الدواء</label>
              <input name="medName" placeholder="مثال: جلوكوفاج، كونكور..." />
            </div>
            <div className="form-group">
              <label>التركيز</label>
              <input name="medConcentration" placeholder="مثال: 500mg" />
            </div>
            <div className="form-group">
              <label>الجرعة</label>
              <input name="medDosage" placeholder="مثال: قرص واحد" />
            </div>
            <div className="form-group">
              <label>عدد المرات</label>
              <input name="medFrequency" placeholder="مثال: مرتين يومياً" />
            </div>
            <div className="form-group">
              <label>مدة العلاج</label>
              <input name="medDuration" placeholder="مثال: شهر كامل" />
            </div>
            <div className="form-group">
              <label>طريقة الاستخدام</label>
              <input name="medUsage" placeholder="مثال: بعد الأكل" />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>الكمية المقترحة / طريقة الصرف</label>
            <input name="medQuantity" placeholder="مثال: علبة كل شهر لمدة 6 شهور" />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addMedication}
        className="btn btn-outline"
        style={{
          marginTop: '8px',
          width: '100%',
          justifyContent: 'center',
          minHeight: '48px',
          fontSize: '1rem',
          fontWeight: 700,
        }}
      >
        ➕ إضافة دواء آخر للروشتة
      </button>
    </div>
  )
}
