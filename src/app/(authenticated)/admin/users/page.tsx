import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { toggleUserActive } from '@/lib/actions/user-actions'

export default async function UsersPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <div className="page-header">
        <div>
          <h1>👥 الحسابات المصرح لها بالدخول</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            يتم إنشاء الحسابات يدوياً فقط من خلال مسؤول النظام لضمان أعلى مستويات الأمان والخصوصية.
          </p>
        </div>
        <Link href="/dashboard" className="btn btn-outline">
          ← لوحة التحكم
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--primary)', background: 'var(--bg-input)' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          🔒 <strong>تنبيه الأمان:</strong> تم إيقاف التسجيل التلقائي أو إضافة مستخدمين من واجهة الموقع. لإضافة مستخدم جديد أو تعديل كلمة مرور، أرسل اسم المستخدم وكلمة المرور في الشات ليتم إضافته فوراً إلى قاعدة البيانات.
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>📋 قائمة المستخدمين المعتمدين في النظام ({users.length})</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>الاسم الكامل</th>
                <th>اسم المستخدم</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th>التحكم</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.name}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{user.username}</td>
                  <td>
                    <span className={`badge ${user.active ? 'badge-approved' : 'badge-rejected'}`}>
                      {user.active ? 'نشط ومصرح له' : 'معطل مؤقتاً'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td>
                    <form action={toggleUserActive.bind(null, user.id)}>
                      <button type="submit" className={`btn ${user.active ? 'btn-red' : 'btn-green'}`} style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
                        {user.active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
