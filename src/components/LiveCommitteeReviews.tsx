'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface CommitteeReviewItem {
  id: number
  userId: number
  decision: string
  notes: string | null
  createdAt: string | Date
  user: {
    name: string
  }
}

interface LiveCommitteeReviewsProps {
  visitId: number
  initialReviews: CommitteeReviewItem[]
}

export default function LiveCommitteeReviews({
  visitId,
  initialReviews,
}: LiveCommitteeReviewsProps) {
  const router = useRouter()
  const [reviews, setReviews] = useState<CommitteeReviewItem[]>(initialReviews)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newReviewAlert, setNewReviewAlert] = useState<string | null>(null)
  const [lastCheckTime, setLastCheckTime] = useState<string>('')

  // Update check function
  const checkNewReviews = useCallback(
    async (manual = false) => {
      if (manual) setIsRefreshing(true)
      try {
        const res = await fetch(`/api/visits/${visitId}/reviews`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })
        if (!res.ok) return
        const data = await res.json()
        if (data && Array.isArray(data.reviews)) {
          const incomingReviews: CommitteeReviewItem[] = data.reviews

          // Check if there are new reviews or changed reviews
          if (incomingReviews.length > reviews.length) {
            const newestReview = incomingReviews[0]
            const author = newestReview?.user?.name || 'عضو باللجنة'
            setNewReviewAlert(`📢 تم تسجيل رأي جديد للتو من ${author}! تم تحديث القائمة تلقائياً.`)
            setReviews(incomingReviews)
            router.refresh()
          } else if (
            incomingReviews.length !== reviews.length ||
            JSON.stringify(incomingReviews.map((r) => `${r.id}-${r.decision}-${r.notes}`)) !==
              JSON.stringify(reviews.map((r) => `${r.id}-${r.decision}-${r.notes}`))
          ) {
            setReviews(incomingReviews)
            router.refresh()
          }
        }
      } catch (err) {
        console.error('Failed to poll committee reviews:', err)
      } finally {
        if (manual) setIsRefreshing(false)
        setLastCheckTime(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      }
    },
    [visitId, reviews, router]
  )

  // Polling effect every 4 seconds to achieve real-time synchronization
  useEffect(() => {
    setLastCheckTime(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    const timer = setInterval(() => {
      checkNewReviews(false)
    }, 4000)

    return () => clearInterval(timer)
  }, [checkNewReviews])

  // Clear new review alert after 7 seconds
  useEffect(() => {
    if (newReviewAlert) {
      const dismiss = setTimeout(() => {
        setNewReviewAlert(null)
      }, 7000)
      return () => clearTimeout(dismiss)
    }
  }, [newReviewAlert])

  // Breakdown statistics
  const charityCount = reviews.filter((r) => r.decision === 'charity').length
  const paidCount = reviews.filter((r) => r.decision === 'paid').length
  const zakatCount = reviews.filter((r) => r.decision === 'zakat').length
  const deniedCount = reviews.filter((r) => r.decision === 'denied').length
  const legacyApproved = reviews.filter((r) => r.decision === 'approved').length
  const legacyRejected = reviews.filter((r) => r.decision === 'rejected').length

  return (
    <div className="card" style={{ position: 'relative' }}>
      {/* Header with live sync indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2
            style={{
              fontSize: '1rem',
              margin: 0,
              color: 'var(--yellow)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>👥</span>
            <span>توصيات وآراء أعضاء اللجنة الطبية</span>
            <span
              style={{
                fontSize: '0.85rem',
                background: 'rgba(234, 179, 8, 0.15)',
                color: 'var(--yellow)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 700,
              }}
            >
              {reviews.length}
            </span>
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              color: 'var(--green)',
              background: 'rgba(34, 197, 94, 0.1)',
              padding: '2px 8px',
              borderRadius: '10px',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}
            title={`آخر فحص مباشر: ${lastCheckTime}`}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--green)',
                boxShadow: '0 0 6px var(--green)',
                display: 'inline-block',
              }}
            />
            مزامنة مباشرة
          </span>

          <button
            type="button"
            onClick={() => checkNewReviews(true)}
            disabled={isRefreshing}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', padding: '3px 8px' }}
            title="فحص فوري للآراء الآن"
          >
            {isRefreshing ? '⏳...' : '🔄 تحديث'}
          </button>
        </div>
      </div>

      {/* Real-time Toast/Banner if new review arrived */}
      {newReviewAlert && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid var(--green)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--green)',
            fontSize: '0.88rem',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          <span>{newReviewAlert}</span>
          <button
            type="button"
            onClick={() => setNewReviewAlert(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--green)',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Stats Pills */}
      {reviews.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {charityCount > 0 && (
            <span className="badge badge-approved" style={{ fontSize: '0.78rem' }}>
              🟢 صدقة: {charityCount}
            </span>
          )}
          {paidCount > 0 && (
            <span className="badge badge-doctor" style={{ fontSize: '0.78rem' }}>
              🔵 بمال: {paidCount}
            </span>
          )}
          {zakatCount > 0 && (
            <span className="badge badge-committee" style={{ fontSize: '0.78rem' }}>
              🟣 زكاة: {zakatCount}
            </span>
          )}
          {deniedCount > 0 && (
            <span className="badge badge-rejected" style={{ fontSize: '0.78rem' }}>
              🔴 لا يصرف: {deniedCount}
            </span>
          )}
          {legacyApproved > 0 && (
            <span className="badge badge-approved" style={{ fontSize: '0.78rem' }}>
              🟢 موافق: {legacyApproved}
            </span>
          )}
          {legacyRejected > 0 && (
            <span className="badge badge-rejected" style={{ fontSize: '0.78rem' }}>
              🔴 غير موافق: {legacyRejected}
            </span>
          )}
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div
          style={{
            padding: '16px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
          }}
        >
          لم يسجل أعضاء اللجنة أي رأي بعد. يمكنك اتخاذ القرار النهائي مباشرة بصفتك طبيباً معتمداً.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '420px',
            overflowY: 'auto',
          }}
        >
          {reviews.map((r, index) => (
            <div
              key={r.id}
              style={{
                padding: '12px 14px',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{r.user.name}</strong>
                  {index === 0 && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: 'var(--primary)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      الأحدث
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {new Date(r.createdAt).toLocaleString('ar-EG', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div style={{ marginTop: '4px' }}>
                {r.decision === 'paid' && <span className="badge badge-doctor">🔵 يصرف بمال</span>}
                {r.decision === 'charity' && (
                  <span className="badge badge-approved">🟢 يصرف كصدقة</span>
                )}
                {r.decision === 'zakat' && (
                  <span className="badge badge-committee">🟣 يصرف كزكاة مال</span>
                )}
                {r.decision === 'denied' && (
                  <span className="badge badge-rejected">🔴 لا يصرف</span>
                )}
                {r.decision === 'approved' && (
                  <span className="badge badge-approved">🟢 موافق على الصرف</span>
                )}
                {r.decision === 'rejected' && (
                  <span className="badge badge-rejected">🔴 غير موافق</span>
                )}
                {r.decision === 'needs_info' && (
                  <span className="badge badge-committee">🟡 يحتاج معلومات إضافية</span>
                )}
              </div>
              {r.notes && (
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    marginTop: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    borderRight: '3px solid var(--primary)',
                  }}
                >
                  {r.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
