'use client'

import { useState, useRef, ChangeEvent } from 'react'

export default function MedicationForm() {
  const [activeTab, setActiveTab] = useState<'both' | 'image' | 'manual'>('both')
  const [medications, setMedications] = useState([{ id: 1 }])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageDetails, setImageDetails] = useState<{ originalSize: string; compressedSize: string } | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP)')
      return
    }

    setIsCompressing(true)
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Compress using Canvas: limit max dimension to 1200px, quality 0.78
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.78)
          setImagePreview(compressedDataUrl)

          // Approximate compressed size in bytes from base64 length
          const approxBytes = Math.round((compressedDataUrl.length * 3) / 4)
          setImageDetails({
            originalSize: formatBytes(file.size),
            compressedSize: formatBytes(approxBytes),
          })
        }
        setIsCompressing(false)
      }
      img.onerror = () => {
        setIsCompressing(false)
        alert('تعذر قراءة الصورة، يرجى تجربة صورة أخرى')
      }
      img.src = event.target?.result as string
    }

    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImagePreview(null)
    setImageDetails(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function addMedication() {
    setMedications([...medications, { id: Date.now() }])
  }

  function removeMedication(id: number) {
    if (medications.length <= 1) return
    setMedications(medications.filter((m) => m.id !== id))
  }

  return (
    <div>
      {/* Hidden input storing the compressed base64 data for form submission */}
      <input type="hidden" name="prescriptionImage" value={imagePreview || ''} />

      {/* Mode Selection Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💊</span>
            <span>بيانات الروشتة والأدوية</span>
          </h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            يمكنك رفع صورة الروشتة، أو كتابة الأدوية يدوياً، أو الجمع بينهما
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            background: 'var(--bg-input)',
            padding: '6px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('both')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              background: activeTab === 'both' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'both' ? '#fff' : 'var(--text-primary)',
              transition: 'all 0.15s ease',
            }}
          >
            🌟 خيار متكامل (صورة + تفريغ)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              background: activeTab === 'image' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'image' ? '#fff' : 'var(--text-primary)',
              transition: 'all 0.15s ease',
            }}
          >
            📷 رفع / تصوير الروشتة فقط
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              background: activeTab === 'manual' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'manual' ? '#fff' : 'var(--text-primary)',
              transition: 'all 0.15s ease',
            }}
          >
            ✍️ كتابة الأدوية يدوياً فقط
          </button>
        </div>
      </div>

      {/* 1. Image Upload Section (Shown when activeTab is 'both' or 'image') */}
      {(activeTab === 'both' || activeTab === 'image') && (
        <div
          style={{
            padding: '18px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius)',
            border: '2px dashed ' + (imagePreview ? 'var(--green)' : 'var(--border)'),
            marginBottom: '20px',
            transition: 'border 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📷</span> إرفاق صورة الروشتة الأصلية
            </span>
            {imageDetails && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                الحجم: {imageDetails.compressedSize} (تم الضغط من {imageDetails.originalSize})
              </span>
            )}
          </div>

          {!imagePreview ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="prescription-file-input"
              />
              <label
                htmlFor="prescription-file-input"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '30px 20px',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(99, 102, 241, 0.04)',
                  transition: 'background 0.2s ease',
                }}
              >
                <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📸</span>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', marginBottom: '4px' }}>
                  اضغط هنا لاختيار صورة الروشتة أو التقاطها بكاميرا الهاتف
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  يدعم صور JPG, PNG, WEBP (يتم تحسينها وضغطها تلقائياً لسرعة التحميل)
                </span>
                {isCompressing && (
                  <span style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--yellow)', fontWeight: 600 }}>
                    ⏳ جاري معالجة وضغط الصورة...
                  </span>
                )}
              </label>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div
                  style={{
                    position: 'relative',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    maxHeight: '220px',
                    maxWidth: '320px',
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="معاينة الروشتة"
                    style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '200px' }}>
                  <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✅</span> تم إرفاق صورة الروشتة بنجاح
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    سيتمكن أعضاء اللجنة والطبيب المعتمد من تكبير الصورة وفحص تفاصيل وتوقيع الطبيب بوضوح.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-outline"
                      style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                    >
                      🔄 تغيير الصورة
                    </button>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="btn btn-outline"
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.85rem',
                        color: 'var(--red)',
                        borderColor: 'rgba(244, 63, 94, 0.4)',
                        background: 'rgba(244, 63, 94, 0.08)',
                      }}
                    >
                      ✕ حذف الصورة
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Manual Medication Entry Section (Shown when activeTab is 'both' or 'manual') */}
      {(activeTab === 'both' || activeTab === 'manual') && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📝</span> تفريغ أسماء وجرعات الأدوية {activeTab === 'both' ? '(اختياري مع الصورة)' : ''}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              ({medications.length} دواء)
            </span>
          </div>

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
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
                  💊 الدواء رقم {index + 1}
                </span>
                {medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedication(med.id)}
                    className="btn btn-outline"
                    style={{
                      color: 'var(--red)',
                      borderColor: 'rgba(244, 63, 94, 0.4)',
                      background: 'rgba(244, 63, 94, 0.08)',
                      padding: '4px 12px',
                      minHeight: '34px',
                      fontSize: '0.82rem',
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
              minHeight: '44px',
              fontSize: '0.95rem',
              fontWeight: 700,
            }}
          >
            ➕ إضافة دواء آخر للروشتة
          </button>
        </div>
      )}
    </div>
  )
}
