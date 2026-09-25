'use client'

import { useState, useEffect } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const err = params.get('error')
      if (err === 'invalid_credentials') {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة')
      } else if (err === 'missing_fields') {
        setError('يرجى إدخال اسم المستخدم وكلمة المرور')
      } else if (err === 'rate_limited') {
        setError('تم تجاوز عدد محاولات الدخول المسموح بها، يرجى الانتظار 15 دقيقة قبل المحاولة مجدداً.')
      }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        setError(data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة')
        setLoading(false)
        return
      }

      setSuccess(true)
      // Navigate to dashboard with full page load to ensure session cookie is sent cleanly
      window.location.href = data.redirect || '/dashboard'
    } catch (err: any) {
      console.error('Login request failed:', err)
      setError('حدث خطأ في الاتصال بالخادم، يرجى المحاولة مرة أخرى')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '16px',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '32px 24px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏥</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            نظام المجمع الطبي
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            تسجيل الدخول للنظام
          </p>
        </div>

        {error && (
          <div
            id="login-error-message"
            style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: '#86efac',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>✅</span>
            <span>تم التحقق بنجاح! جاري الدخول...</span>
          </div>
        )}

        <form action="/api/auth/login" method="POST" onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label htmlFor="username-input" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
              اسم المستخدم
            </label>
            <input
              id="username-input"
              name="username"
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || success}
              placeholder="مثال: admin"
              autoComplete="username"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '1rem',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="password-input" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
              كلمة المرور
            </label>
            <input
              id="password-input"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || success}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '1rem',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>

          <button
            id="login-submit-button"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading || success}
            style={{
              width: '100%',
              minHeight: '52px',
              fontSize: '1.15rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: loading || success ? 'not-allowed' : 'pointer',
              opacity: loading || success ? 0.8 : 1,
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : success ? (
              <span>جاري التحويل...</span>
            ) : (
              <span>دخول</span>
            )}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
