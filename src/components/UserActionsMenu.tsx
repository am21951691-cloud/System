'use client'

import { useState } from 'react'
import { updateUser, resetUserPassword, toggleUserActive } from '@/lib/actions/user-actions'

interface UserActionsMenuProps {
  user: {
    id: number
    username: string
    name: string
    role: string
    active: boolean
  }
  isCurrent: boolean
}

export default function UserActionsMenu({ user, isCurrent }: UserActionsMenuProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleToggle = async () => {
    if (isCurrent) return
    const confirmed = window.confirm(
      user.active
        ? `هل أنت متأكد من تعطيل حساب [${user.name}]؟ لن يتمكن من تسجيل الدخول.`
        : `هل أنت متأكد من إعادة تفعيل حساب [${user.name}]؟`
    )
    if (!confirmed) return
    setIsSubmitting(true)
    try {
      await toggleUserActive(user.id)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setShowEditModal(true)}
          className="btn btn-sm btn-outline"
          style={{ padding: '5px 10px', fontSize: '0.8rem', minHeight: '32px' }}
        >
          ✏️ تعديل
        </button>

        <button
          type="button"
          onClick={() => setShowPasswordModal(true)}
          className="btn btn-sm btn-outline"
          style={{ padding: '5px 10px', fontSize: '0.8rem', minHeight: '32px', borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--yellow)' }}
        >
          🔑 كلمة المرور
        </button>

        {isCurrent ? (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '4px 6px' }}>
            (حسابك الحالي)
          </span>
        ) : (
          <button
            type="button"
            onClick={handleToggle}
            disabled={isSubmitting}
            className={`btn btn-sm ${user.active ? 'btn-red' : 'btn-green'}`}
            style={{ padding: '5px 12px', fontSize: '0.8rem', minHeight: '32px' }}
          >
            {user.active ? 'تعطيل' : 'تفعيل'}
          </button>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700 }}>
                ✏️ تعديل بيانات المستخدم
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                setIsSubmitting(true)
                try {
                  await updateUser(user.id, formData)
                  setShowEditModal(false)
                } finally {
                  setIsSubmitting(false)
                }
              }}
            >
              <div className="form-group">
                <label>الاسم بالكامل *</label>
                <input name="name" defaultValue={user.name} required />
              </div>

              <div className="form-group">
                <label>اسم المستخدم *</label>
                <input
                  name="username"
                  defaultValue={user.username}
                  required
                  style={{ direction: 'ltr', textAlign: 'right' }}
                />
              </div>

              <div className="form-group">
                <label>الدور والصلاحية *</label>
                <select name="role" defaultValue={user.role} required disabled={isCurrent}>
                  <option value="doctor">🩺 طبيب معتمد (اتخاذ القرار النهائي وتفريغ الأدوية)</option>
                  <option value="member">👥 عضو لجنة طبية (تقييم الحالات وتقديم التوصيات)</option>
                  <option value="accountant">💰 محاسب (متابعة الصرف والبيانات المالية)</option>
                  <option value="admin">🔒 مدير نظام (كامل الصلاحيات)</option>
                </select>
                {isCurrent && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    لا يمكنك تغيير دور حسابك الشخصي لحمايتك من فقدان الوصول الإداري.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ flex: 1, minHeight: '44px' }}
                >
                  {isSubmitting ? 'جاري الحفظ...' : '💾 حفظ التعديلات'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-outline"
                  style={{ minHeight: '44px' }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '460px',
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700, color: 'var(--yellow)' }}>
                🔑 تعيين كلمة مرور جديدة
              </h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              تعيين كلمة مرور جديدة لحساب: <strong>{user.name}</strong> ({user.username})
            </p>

            <form
              action={async (formData) => {
                setIsSubmitting(true)
                try {
                  await resetUserPassword(user.id, formData)
                  setShowPasswordModal(false)
                } finally {
                  setIsSubmitting(false)
                }
              }}
            >
              <div className="form-group">
                <label>كلمة المرور الجديدة *</label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  يجب ألا تقل عن 6 خانات. سيتمكن المستخدم من الدخول بها فوراً.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-yellow"
                  style={{ flex: 1, minHeight: '44px' }}
                >
                  {isSubmitting ? 'جاري التعيين...' : '🔑 تعيين كلمة المرور'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn btn-outline"
                  style={{ minHeight: '44px' }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
