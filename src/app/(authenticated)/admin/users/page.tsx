import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createUser } from '@/lib/actions/user-actions'
import UserActionsMenu from '@/components/UserActionsMenu'

export default async function UsersPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    redirect('/dashboard')
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <div className="page-header">
        <div>
          <h1>👥 إدارة مستخدمي وحسابات النظام</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            إدارة الحسابات المصرح لها، تعيين الأدوار والصلاحيات، وإضافة مستخدمين جدد.
          </p>
        </div>
        <Link href="/dashboard" className="btn btn-outline">
          ← لوحة المتابعة
        </Link>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* User Creation Form */}
        <div className="card" style={{ borderTop: '3px solid var(--primary)' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>➕</span>
            <span>إضافة مستخدم جديد للنظام</span>
          </h2>

          <form action={createUser}>
            <div className="form-group">
              <label>الاسم بالكامل *</label>
              <input name="name" required placeholder="مثال: د. أحمد خالد" />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>اسم المستخدم (لتسجيل الدخول) *</label>
                <input name="username" required placeholder="مثال: dr_ahmed" style={{ direction: 'ltr', textAlign: 'right' }} />
              </div>
              <div className="form-group">
                <label>الدور والصلاحية *</label>
                <select name="role" required defaultValue="doctor">
                  <option value="doctor">🩺 طبيب معتمد (اتخاذ القرار النهائي وتفريغ الأدوية)</option>
                  <option value="member">👥 عضو لجنة طبية (تقييم الحالات وتقديم التوصيات)</option>
                  <option value="accountant">💰 محاسب (متابعة الصرف والبيانات المالية)</option>
                  <option value="admin">🔒 مدير نظام (كامل الصلاحيات)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>كلمة المرور *</label>
              <input name="password" type="password" required placeholder="••••••••" minLength={6} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                يجب ألا تقل عن 6 خانات، ويفضل أن تحتوي على حروف وأرقام.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              ➕ إنشاء الحساب فوراً
            </button>
          </form>
        </div>

        {/* Security & Access Instructions */}
        <div className="card" style={{ background: 'var(--bg-input)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', marginBottom: '12px', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🛡️</span>
              <span>سياسة الأمان والتحكم في الوصول</span>
            </h2>
            <ul style={{ paddingRight: '20px', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.9' }}>
              <li>
                <strong>مدير النظام (Admin):</strong> يملك كافة الصلاحيات بما فيها إدارة المستخدمين وتعديلهم وسجل الرقابة وإضافة الحالات.
              </li>
              <li>
                <strong>الطبيب المعتمد (Doctor):</strong> يستطيع اعتماد القرار النهائي لصرف الأدوية وتفريغ أصناف وجداول الصرف.
              </li>
              <li>
                <strong>عضو اللجنة (Member):</strong> تقييم الحالات وإبداء التوصيات دون الاطلاع على الأدوية أو اعتماد الصرف النهائي.
              </li>
              <li>
                <strong>المحاسب (Accountant):</strong> متابعة بيانات الصرف والكميات والقرارات المالية بدون الاطلاع على التشخيص الطبي والسريريات.
              </li>
              <li>
                <strong>تعطيل الحساب:</strong> يؤدي فوراً إلى حظر الدخول دون حذف سجل العمليات السابقة للمستخدم.
              </li>
            </ul>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>
              🔒 جميع عمليات إنشاء أو تعديل الحسابات أو تغيير كلمات المرور موثقة بصورة غير قابلة للمسح في سجل الأثر الرقابي.
            </span>
          </div>
        </div>
      </div>

      {/* Users List Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.05rem', marginBottom: '16px' }}>
          📋 قائمة الحسابات المسجلة في النظام ({users.length})
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>الاسم الكامل</th>
                <th>اسم المستخدم</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th>إدارة الحساب</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isCurrent = user.id === session.userId
                return (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600 }}>{user.name}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{user.username}</td>
                    <td>
                      {user.role === 'admin' ? (
                        <span className="badge badge-rejected" style={{ fontSize: '0.72rem' }}>مدير نظام</span>
                      ) : user.role === 'doctor' ? (
                        <span className="badge badge-doctor" style={{ fontSize: '0.72rem' }}>طبيب معتمد</span>
                      ) : user.role === 'accountant' ? (
                        <span className="badge badge-committee" style={{ fontSize: '0.72rem' }}>محاسب</span>
                      ) : (
                        <span className="badge badge-approved" style={{ fontSize: '0.72rem' }}>عضو لجنة</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${user.active ? 'badge-approved' : 'badge-rejected'}`}>
                        {user.active ? 'نشط ومصرح له' : 'معطل مؤقتاً'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td>
                      <UserActionsMenu user={user} isCurrent={isCurrent} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
