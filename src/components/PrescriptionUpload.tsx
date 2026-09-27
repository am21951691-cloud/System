'use client'

import { useState, useRef, ChangeEvent } from 'react'

interface PrescriptionUploadProps {
  initialImage?: string | null
}

export default function PrescriptionUpload({ initialImage = null }: PrescriptionUploadProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage)
  const [imageDetails, setImageDetails] = useState<{ originalSize: string; compressedSize: string } | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)

  // Explicit, separate references for Camera vs Device Gallery
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP)')
      return
    }

    setIsCompressing(true)
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // High quality client-side canvas compression
        const canvas = document.createElement('canvas')
        const MAX_DIMENSION = 1200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width)
            width = MAX_DIMENSION
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height)
            height = MAX_DIMENSION
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.78)
          setImagePreview(compressedDataUrl)

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
        alert('تعذر قراءة ملف الصورة، يرجى تجربة ملف آخر')
      }
      img.src = event.target?.result as string
    }

    reader.readAsDataURL(file)
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
    // Reset inputs so selecting the same file again works
    e.target.value = ''
  }

  function removeImage() {
    setImagePreview(null)
    setImageDetails(null)
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Hidden file input strictly for Camera capture */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Hidden file input strictly for Device Gallery / File Picker (NO capture attribute) */}
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Hidden input carrying the base64 Data URL to the Server Action */}
      <input type="hidden" name="prescriptionImage" value={imagePreview || ''} />

      {!imagePreview ? (
        <div
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius)',
            padding: '28px 20px',
            textAlign: 'center',
            background: 'var(--bg-input)',
            transition: 'border-color 0.2s',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📄</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
            إرفاق صورة الروشتة الطبية
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', maxWidth: '480px', margin: '0 auto 20px' }}>
            يمكنك التقاط صورة واضحة للروشتة مباشرة بالكاميرا أو اختيار صورة محفوظة على جهازك. يتم ضغط الصورة تلقائياً للحفاظ على سرعة النظام ودقة الطباعة.
          </p>

          {isCompressing ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem' }}>
              <span>⏳</span>
              <span>جاري ضغط ومعالجة الصورة...</span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: '14px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="btn btn-primary"
                style={{ minHeight: '48px', minWidth: '190px' }}
              >
                <span>📷</span>
                <span>التقاط صورة بالكاميرا</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="btn btn-outline"
                style={{ minHeight: '48px', minWidth: '190px', background: 'rgba(255,255,255,0.06)' }}
              >
                <span>🖼️</span>
                <span>اختيار من الجهاز</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            background: 'var(--bg-card)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>✅</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                تم إرفاق صورة الروشتة بنجاح
              </strong>
              {imageDetails && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--green)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  الحجم بعد الضغط: {imageDetails.compressedSize} (الأصلي: {imageDetails.originalSize})
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="btn btn-sm btn-outline"
                style={{ minHeight: '38px', fontSize: '0.85rem' }}
              >
                <span>🖼️</span>
                <span>تغيير من الجهاز</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="btn btn-sm btn-outline"
                style={{ minHeight: '38px', fontSize: '0.85rem' }}
              >
                <span>📷</span>
                <span>إعادة التقاط</span>
              </button>

              <button
                type="button"
                onClick={removeImage}
                className="btn btn-sm btn-red"
                style={{ minHeight: '38px', fontSize: '0.85rem' }}
              >
                <span>🗑️</span>
                <span>إزالة الصورة</span>
              </button>
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              background: '#0a0f1d',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <img
              src={imagePreview}
              alt="معاينة الروشتة المرفقة"
              style={{
                maxHeight: '320px',
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: '6px',
                display: 'inline-block',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
