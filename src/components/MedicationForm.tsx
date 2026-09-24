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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>دواء {index + 1}</span>
            {medications.length > 1 && (
              <button
                type="button"
                onClick={() => removeMedication(med.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--red)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                ✕ حذف
              </button>
            )}
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label>اسم الدواء</label>
              <input name="medName" />
            </div>
            <div className="form-group">
              <label>التركيز</label>
              <input name="medConcentration" />
            </div>
            <div className="form-group">
              <label>الجرعة</label>
              <input name="medDosage" />
            </div>
            <div className="form-group">
              <label>عدد المرات</label>
              <input name="medFrequency" />
            </div>
            <div className="form-group">
              <label>مدة العلاج</label>
              <input name="medDuration" />
            </div>
            <div className="form-group">
              <label>طريقة الاستخدام</label>
              <input name="medUsage" />
            </div>
          </div>
          <div className="form-group">
            <label>الكمية / طريقة الصرف</label>
            <input name="medQuantity" placeholder="مثال: علبة كل شهر لمدة 6 شهور" />
          </div>
        </div>
      ))}

      <button type="button" onClick={addMedication} className="btn btn-outline" style={{ marginTop: '4px' }}>
        ➕ إضافة دواء آخر
      </button>
    </div>
  )
}
