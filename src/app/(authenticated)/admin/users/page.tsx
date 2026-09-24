import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createUser, toggleUserActive } from '@/lib/actions/user-actions'

export default async function UsersPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <div className="page-header">
        <h1>👥 إدارة المستخدمين</h1>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>➕ إضافة مستخدم جديد</h2>
        <form action={createUser}>
          <div className="grid-2">
            <div className="form-group">
              <label>اسم المستخدم *</label>
              <input name="username" required />
            </div>
            <div className="form-group">
              <label>الاسم الكامل *</label>
              <input name="name" required />
            </div>
            <div className="form-group">
              <label>كلمة المرور *</label>
              <input name="password" type="password" required />
            </div>
            <div className="form-group">
              <label>الدور *</label>
              <select name="role" required>
                <option value="member">عضو لجنة</option>
                <option value="doctor">طبيب</option>
                <option value="admin">مدير</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            ✅ إضافة المستخدم
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>📋 المستخدمون الحاليون</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>اسم المستخدم</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.name}</td>
                  <td>{user.username}</td>
                  <td>
                    {user.role === 'admin' ? '🔴 مدير' :
                     user.role === 'doctor' ? '🔵 طبيب' : '🟢 عضو لجنة'}
                  </td>
                  <td>
                    <span className={`badge ${user.active ? 'badge-approved' : 'badge-rejected'}`}>
                      {user.active ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td>
                    <form action={toggleUserActive.bind(null, user.id)}>
                      <button type="submit" className={`btn ${user.active ? 'btn-red' : 'btn-green'}`} style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
                        {user.active ? 'تعطيل' : 'تفعيل'}
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
