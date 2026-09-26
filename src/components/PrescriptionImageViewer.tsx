'use client'

import { useState } from 'react'

interface Props {
  imageUrl: string
  title?: string
}

export default function PrescriptionImageViewer({ imageUrl, title = 'صورة الروشتة الأصلية' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)

  function rotate() {
    setRotation((prev) => (prev + 90) % 360)
  }

  function zoomIn() {
    setScale((prev) => Math.min(prev + 0.25, 3))
  }

  function zoomOut() {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  function resetZoom() {
    setScale(1)
    setRotation(0)
  }

  return (
    <>
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          background: 'var(--bg-input)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(99, 102, 241, 0.08)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📷</span> {title}
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8rem', minHeight: '32px' }}
          >
            🔍 تكبير وعرض كامل الشاشة
          </button>
        </div>

        <div
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setIsOpen(true)}
        >
          <img
            src={imageUrl}
            alt={title}
            style={{
              maxWidth: '100%',
              maxHeight: '380px',
              objectFit: 'contain',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s ease',
            }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
            💡 انقر على الصورة لتكبيرها وقراءة الخط بوضوح كامل
          </span>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
          }}
        >
          {/* Lightbox Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 16px',
              backgroundColor: 'rgba(30, 41, 59, 0.9)',
              borderRadius: 'var(--radius)',
              color: '#fff',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📷</span>
              <span>{title}</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={zoomIn}
                className="btn btn-outline"
                style={{ color: '#fff', borderColor: '#475569', padding: '6px 12px', minHeight: '36px' }}
                title="تكبير"
              >
                ➕ تكبير
              </button>
              <button
                type="button"
                onClick={zoomOut}
                className="btn btn-outline"
                style={{ color: '#fff', borderColor: '#475569', padding: '6px 12px', minHeight: '36px' }}
                title="تصغير"
              >
                ➖ تصغير
              </button>
              <button
                type="button"
                onClick={rotate}
                className="btn btn-outline"
                style={{ color: '#fff', borderColor: '#475569', padding: '6px 12px', minHeight: '36px' }}
                title="تدوير 90 درجة"
              >
                🔄 تدوير
              </button>
              <button
                type="button"
                onClick={resetZoom}
                className="btn btn-outline"
                style={{ color: '#fff', borderColor: '#475569', padding: '6px 12px', minHeight: '36px' }}
                title="إعادة الضبط"
              >
                ⏹️ ضبط
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn btn-primary"
                style={{ padding: '6px 18px', minHeight: '36px', fontWeight: 700, background: '#ef4444' }}
              >
                ✕ إغلاق
              </button>
            </div>
          </div>

          {/* Lightbox Image Container */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false)
            }}
          >
            <img
              src={imageUrl}
              alt={title}
              style={{
                transform: `rotate(${rotation}deg) scale(${scale})`,
                transition: 'transform 0.15s ease-out',
                maxWidth: '92vw',
                maxHeight: '82vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
