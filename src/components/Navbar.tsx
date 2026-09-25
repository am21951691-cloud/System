import { getSession } from '@/lib/auth'
import Link from 'next/link'

export default async function Navbar() {
  const session = await getSession()
  if (!session) return null

  return (
    <nav
      className="navbar-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <Link
        href="/dashboard"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          textDecoration: 'none',
        }}
      >
        <span>🏥</span>
        <span>نظام المجمع الطبي</span>
      </Link>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/dashboard"
          className="tab-btn"
          style={{
            fontSize: '0.95rem',
            padding: '8px 16px',
            minHeight: '44px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          📊 لوحة المتابعة
        </Link>
        <Link
          href="/patients/new"
          className="tab-btn"
          style={{
            fontSize: '0.95rem',
            padding: '8px 16px',
            minHeight: '44px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          ➕ مريض جديد
        </Link>
        <Link
          href="/admin/audit"
          className="tab-btn"
          style={{
            fontSize: '0.95rem',
            padding: '8px 16px',
            minHeight: '44px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          📜 السجل
        </Link>

        <span
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            padding: '8px 14px',
            minHeight: '44px',
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}
        >
          👤 {session.name}
        </span>

        <form action="/api/auth/logout" method="POST" style={{ margin: 0 }}>
          <button
            type="submit"
            className="btn btn-outline"
            style={{
              padding: '8px 16px',
              minHeight: '44px',
              fontSize: '0.9rem',
              color: 'var(--red)',
              borderColor: 'rgba(244, 63, 94, 0.3)',
            }}
          >
            خروج
          </button>
        </form>
      </div>
    </nav>
  )
}
