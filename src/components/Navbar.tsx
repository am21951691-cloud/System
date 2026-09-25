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
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/dashboard"
          className="tab-btn"
          style={{
            fontSize: '0.85rem',
            padding: '6px 12px',
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
            fontSize: '0.85rem',
            padding: '6px 12px',
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
            fontSize: '0.85rem',
            padding: '6px 12px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          📜 السجل
        </Link>

        <span
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.05)',
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
              padding: '6px 12px',
              fontSize: '0.8rem',
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
