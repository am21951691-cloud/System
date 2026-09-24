'use client'

import { useState } from 'react'
import { loginAction } from '@/lib/actions/auth-actions'

export default function LoginPage() {
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    const result = await loginAction(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🏥</div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700 }}>نظام المجمع الطبي</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            تسجيل الدخول
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px 16px',
            background: 'rgba(239,68,68,0.15)',
            color: 'var(--red)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        <form action={handleSubmit}>
          <div className="form-group">
            <label>اسم المستخدم</label>
            <input name="username" type="text" required autoFocus />
          </div>
          <div className="form-group">
            <label>كلمة المرور</label>
            <input name="password" type="password" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            دخول
          </button>
        </form>
      </div>
    </div>
  )
}
