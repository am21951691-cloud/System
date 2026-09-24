import { getSession } from '@/lib/auth'
import { logoutAction } from '@/lib/actions/auth-actions'
import Link from 'next/link'

export default async function Navbar() {
  const session = await getSession()
  if (!session) return null

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
    }}>
      <a href="/dashboard" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '1.1rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
      }}>
        🏥 نظام المجمع الطبي
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {session.role === 'admin' && (
          <Link href="/admin/users" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            إدارة المستخدمين
          </Link>
        )}
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          👤 {session.name}
        </span>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-outline" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
            خروج
          </button>
        </form>
      </div>
    </nav>
  )
}
