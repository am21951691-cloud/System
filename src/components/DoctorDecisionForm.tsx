'use client'

import { useState } from 'react'
import { submitFinalDecision } from '@/lib/actions/decision-actions'

interface MedicationRow {
  name: string
  concentration: string
  dosage: string
  usageMethod: string
  frequency: string
  duration: string
  dispenseInterval: string
  quantity: string
  totalQuantity: string
  notes: string
}

interface ExistingMedication {
  name: string
  concentration?: string | null
  dosage?: string | null
  usageMethod?: string | null
  frequency?: string | null
  duration?: string | null
  dispenseInterval?: string | null
  quantity?: string | null
  totalQuantity?: string | null
  notes?: string | null
}

interface DoctorDecisionFormProps {
  visitId: number
  initialDecisionType?: string
  initialReason?: string | null
  initialDuration?: string | null
  initialQuantity?: string | null
  initialSchedule?: string | null
  existingMedications?: ExistingMedication[]
}

const emptyMedication: MedicationRow = {
  name: '',
  concentration: '',
  dosage: '',
  usageMethod: '',
  frequency: '',
  duration: '',
  dispenseInterval: '',
  quantity: '',
  totalQuantity: '',
  notes: '',
}

export default function DoctorDecisionForm({
  visitId,
  initialDecisionType = 'approved',
  initialReason = '',
  initialDuration = 'شهر واحد',
  initialQuantity = '',
  initialSchedule = 'أول كل شهر',
  existingMedications = [],
}: DoctorDecisionFormProps) {
  const [decisionType, setDecisionType] = useState<string>(
    initialDecisionType === 'rejected' ? 'rejected' : 'approved'
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Medication entry is optional: defaults to true only if there are already existing medications
  const [includeMedications, setIncludeMedications] = useState<boolean>(() => {
    return Boolean(existingMedications && existingMedications.length > 0)
  })

  const [medications, setMedications] = useState<MedicationRow[]>(() => {
    if (existingMedications && existingMedications.length > 0) {
      return existingMedications.map((m) => ({
        name: m.name || '',
        concentration: m.concentration || '',
        dosage: m.dosage || '',
        usageMethod: m.usageMethod || '',
        frequency: m.frequency || '',
        duration: m.duration || '',
        dispenseInterval: m.dispenseInterval || '',
        quantity: m.quantity || '',
        totalQuantity: m.totalQuantity || '',
        notes: m.notes || '',
      }))
    }
    return [{ ...emptyMedication }]
  })

  function addRow() {
    setMedications((prev) => [...prev, { ...emptyMedication }])
  }

  function removeRow(index: number) {
    setMedications((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) {
        setIncludeMedications(false)
      }
      return next
    })
  }

  function updateRow(index: number, field: keyof MedicationRow, value: string) {
    setMedications((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  return (
    <form
      action={async (formData) => {
        setIsSubmitting(true)
        try {
          await submitFinalDecision(visitId, formData)
        } finally {
          setIsSubmitting(false)
        }
      }}
    >
      {/* Hidden input carrying the JSON medications array (sends empty list if skipping or rejected) */}
      <input
        type="hidden"
        name="medicationsData"
        value={
          decisionType === 'approved' && includeMedications
            ? JSON.stringify(medications.filter((m) => m.name && m.name.trim().length > 0))
            : '[]'
        }
      />

      <div className="form-group">
        <label style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', display: 'block' }}>
          ⚖️ القرار الطبي النهائي لصرف الحالة *
        </label>

        {/* The Two Distinct Decision Choices */}
        <div className="grid-2">
          {/* Option 1: يستحق الصرف */}
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '22px 18px',
              minHeight: '115px',
              borderRadius: 'var(--radius)',
              border: `2px solid ${decisionType === 'approved' ? 'var(--green)' : 'var(--border)'}`,
              background: decisionType === 'approved' ? 'rgba(34, 197, 94, 0.12)' : 'var(--bg-input)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center',
            }}
          >
            <input
              type="radio"
              name="decisionType"
              value="approved"
              checked={decisionType === 'approved'}
              onChange={() => setDecisionType('approved')}
              style={{ display: 'none' }}
              required
            />
            <span style={{ fontSize: '2rem', marginBottom: '6px' }}>🟢</span>
            <strong style={{ color: 'var(--green)', fontSize: '1.2rem' }}>
              يستحق الصرف (موافقة)
            </strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              اعتماد الصرف وتفريغ الأدوية الموصوفة وجدولة مواعيد الصيدلية
            </span>
          </label>

          {/* Option 2: لا يصرف */}
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '22px 18px',
              minHeight: '115px',
              borderRadius: 'var(--radius)',
              border: `2px solid ${decisionType === 'rejected' ? 'var(--red)' : 'var(--border)'}`,
              background: decisionType === 'rejected' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-input)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center',
            }}
          >
            <input
              type="radio"
              name="decisionType"
              value="rejected"
              checked={decisionType === 'rejected'}
              onChange={() => setDecisionType('rejected')}
              style={{ display: 'none' }}
              required
            />
            <span style={{ fontSize: '2rem', marginBottom: '6px' }}>🔴</span>
            <strong style={{ color: 'var(--red)', fontSize: '1.2rem' }}>
              لا يستحق الصرف (رفض)
            </strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              عدم الموافقة على صرف هذه الروشتة مع بيان الأسباب أدناه
            </span>
          </label>
        </div>
      </div>

      {/* Dedicated Medications & Dispensing Section (Rendered ONLY when "يستحق الصرف" is chosen) */}
      {decisionType === 'approved' && (
        <div style={{ marginTop: '24px' }}>
          {/* Method Choice: Rely directly on attached prescription image OR transcribe itemized drugs */}
          <div
            style={{
              padding: '16px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📋</span>
              <span>طريقة توثيق الأدوية للصيدلية:</span>
            </div>

            <div className="grid-2">
              {/* Option 1: Rely on prescription image (Default / Skip to General Schedule) */}
              <div
                onClick={() => setIncludeMedications(false)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${!includeMedications ? 'var(--primary)' : 'var(--border)'}`,
                  background: !includeMedications ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.95rem', color: !includeMedications ? 'var(--primary)' : 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📷</span>
                    <span>الاعتماد على صورة الروشتة المرفقة</span>
                  </strong>
                  <input
                    type="radio"
                    name="medMode"
                    checked={!includeMedications}
                    onChange={() => setIncludeMedications(false)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  تخطي تفريغ الأصناف يدوياً، والمتابعة مباشرة إلى الجدولة العامة وتوجيهات الصرف للصيدلية.
                </p>
              </div>

              {/* Option 2: Enter itemized medications (Optional) */}
              <div
                onClick={() => {
                  setIncludeMedications(true)
                  if (medications.length === 0) setMedications([{ ...emptyMedication }])
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${includeMedications ? 'var(--primary)' : 'var(--border)'}`,
                  background: includeMedications ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.95rem', color: includeMedications ? 'var(--primary)' : 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>💊</span>
                    <span>تفريغ أصناف وجرعات الأدوية تفصيلياً</span>
                    <span style={{ fontSize: '0.72rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                      اختياري
                    </span>
                  </strong>
                  <input
                    type="radio"
                    name="medMode"
                    checked={includeMedications}
                    onChange={() => {
                      setIncludeMedications(true)
                      if (medications.length === 0) setMedications([{ ...emptyMedication }])
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  إدخال أسماء الأدوية والجرعات والتكرارات والكميات لكل صنف في النظام.
                </p>
              </div>
            </div>
          </div>

          {/* Itemized Medications Section - Rendered ONLY if includeMedications is true */}
          {includeMedications && (
            <div
              style={{
                marginBottom: '20px',
                padding: '20px 18px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <span>💊</span>
                    <span>تفاصيل الأدوية والصرف المعتمدة (تفريغ الطبيب)</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                      اختياري
                    </span>
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                    يمكنك تفريغ الأصناف وجرعاتها أو الضغط على "تخطي والاعتماد على الروشتة المرفقة" للانتقال للجدولة مباشرة.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setIncludeMedications(false)}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}
                  >
                    تخطي تفريغ الأصناف ↩️
                  </button>
                  <button
                    type="button"
                    onClick={addRow}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.82rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  >
                    <span>➕</span>
                    <span>إضافة دواء آخر</span>
                  </button>
                </div>
              </div>

              {/* List of Medication Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {medications.map((row, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '16px',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        borderBottom: '1px dashed var(--border)',
                        paddingBottom: '8px',
                      }}
                    >
                      <strong style={{ fontSize: '0.95rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🏷️</span>
                        <span>الصنف الدوائي #{index + 1}</span>
                      </strong>

                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="btn btn-sm btn-red"
                        style={{ padding: '4px 10px', fontSize: '0.78rem', minHeight: '30px' }}
                      >
                        <span>🗑️</span>
                        <span>حذف الصنف</span>
                      </button>
                    </div>

                    {/* Grid 1: Basic Drug Identification */}
                    <div className="grid-3" style={{ marginBottom: '10px' }}>
                      <div className="form-group" style={{ marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.82rem' }}>اسم الدواء (اختياري)</label>
                        <input
                          value={row.name}
                          onChange={(e) => updateRow(index, 'name', e.target.value)}
                          placeholder="مثال: أوجمنتين، ميتفورمين..."
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.82rem' }}>التركيز</label>
                        <input
                          value={row.concentration}
                          onChange={(e) => updateRow(index, 'concentration', e.target.value)}
                          placeholder="مثال: 1 جم، 500 ملجم..."
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.82rem' }}>الجرعة / الشكل الدوائي</label>
                        <input
                          value={row.dosage}
                          onChange={(e) => updateRow(index, 'dosage', e.target.value)}
                          placeholder="مثال: قرص، كبسولة، 5 مل..."
                        />
                      </div>
                    </div>

                    {/* Grid 2: Usage, Frequency, Duration */}
                    <div className="grid-3" style={{ marginBottom: '10px' }}>
                      <div className="form-group" style={{ marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.82rem' }}>طريقة الاستخدام</label>
                        <input
                          value={row.usageMethod}
                          onChange={(e) => updateRow(index, 'usageMethod', e.target.value)}
                          placeholder="مثال: بعد الأكل، قبل النوم، بالفم..."
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.82rem' }}>التكرار</label>
                        <input
                          value={row.frequency}
                          onChange={(e) => updateRow(index, 'frequency', e.target.value)}
                          placeholder="مثال: مرتين يومياً، كل 8 ساعات..."
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.82rem' }}>المدة</label>
                        <input
                          value={row.duration}
                          onChange={(e) => updateRow(index, 'duration', e.target.value)}
                          placeholder="مثال: 7 أيام، أسبوعين، شهر..."
                        />
                      </div>
                    </div>

                    {/* Grid 3: Dispensing Schedule & Quantities */}
                    <div className="grid-3" style={{ marginBottom: '10px' }}>
                      <div className="form-group" style={{ marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.82rem' }}>فترة التكرار / الصرف الدوري</label>
                        <input
                          value={row.dispenseInterval}
                          onChange={(e) => updateRow(index, 'dispenseInterval', e.target.value)}
                          placeholder="مثال: شهرياً، كل 30 يوم، دفعة واحدة..."
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.82rem' }}>الكمية لكل صرف</label>
                        <input
                          value={row.quantity}
                          onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                          placeholder="مثال: علبة واحدة، شريطين..."
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.82rem' }}>إجمالي الكمية المقررة</label>
                        <input
                          value={row.totalQuantity}
                          onChange={(e) => updateRow(index, 'totalQuantity', e.target.value)}
                          placeholder="مثال: 3 علب، 6 أشرطة..."
                        />
                      </div>
                    </div>

                    {/* Row Notes */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.82rem' }}>ملاحظات وتوجيهات خاصة بالصنف</label>
                      <input
                        value={row.notes}
                        onChange={(e) => updateRow(index, 'notes', e.target.value)}
                        placeholder="مثال: يحفظ بالثلاجة، لا يكرر إلا بعد استشارة..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={addRow}
                  className="btn btn-outline"
                  style={{ minHeight: '42px', fontSize: '0.9rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                >
                  <span>➕</span>
                  <span>إضافة دواء آخر للروشتة</span>
                </button>
              </div>
            </div>
          )}

          {/* Master Dispensing Schedule Card */}
          <div
            style={{
              padding: '20px 18px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📅</span>
                <span>الجدولة العامة للصرف للصيدلية والمحاسب</span>
              </h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 600, background: 'rgba(34, 197, 94, 0.1)', padding: '3px 8px', borderRadius: '4px' }}>
                {includeMedications ? 'مكملة لتفريغ الأدوية 💊' : 'مستند الاعتماد: الروشتة المرفقة 📷'}
              </span>
            </div>

            <div className="grid-3">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>مدة الصرف العامة *</label>
                <input
                  name="dispenseDuration"
                  defaultValue={initialDuration || 'شهر واحد'}
                  placeholder="مثال: شهر واحد، 3 شهور، 6 شهور..."
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>جدول ومواعيد الصرف *</label>
                <input
                  name="dispenseSchedule"
                  defaultValue={initialSchedule || 'أول كل شهر'}
                  placeholder="مثال: أول كل شهر، كل 15 يوماً..."
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>الكمية العامة المقررة (اختياري)</label>
                <input
                  name="dispenseQuantity"
                  defaultValue={initialQuantity || ''}
                  placeholder="مثال: كامل الروشتة شهرياً، علبة من كل صنف..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Comments & Pharmacy Instructions */}
      <div className="form-group" style={{ marginTop: '20px' }}>
        <label style={{ fontSize: '0.95rem', fontWeight: 600 }}>
          سبب القرار / توجيهات الطبيب للصيدلية والمحاسب (اختياري)
        </label>
        <textarea
          name="reason"
          rows={3}
          defaultValue={initialReason || ''}
          placeholder={decisionType === 'rejected' ? 'اكتب أسباب عدم الاستحقاق أو ملاحظات الرفض...' : 'اكتب توجيهات الصرف للصيدلية أو أي ملاحظات سريرية...'}
        ></textarea>
      </div>

      {/* Submit Action Button */}
      <div style={{ display: 'flex', gap: '14px', marginTop: '24px' }}>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn btn-lg ${decisionType === 'rejected' ? 'btn-red' : 'btn-green'}`}
          style={{ width: '100%', minHeight: '52px', fontSize: '1.05rem', justifyContent: 'center' }}
        >
          {isSubmitting
            ? 'جاري اعتماد القرار...'
            : decisionType === 'rejected'
            ? '🔴 اعتماد قرار الرفض (لا يستحق الصرف)'
            : includeMedications
            ? '✅ اعتماد قرار الاستحقاق وتفريغ الأدوية وجدولة الصرف'
            : '✅ اعتماد قرار الاستحقاق وجدولة الصرف بالروشتة المرفقة'}
        </button>
      </div>
    </form>
  )
}
