import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AuditLogPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    redirect('/dashboard')
  }

  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, username: true, role: true } },
    },
  })

  return (
    <>
      <div className="page-header">
        <div>
          <h1>📜 سجل العمليات والأثر الرقابي (Audit Log)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            سجل غير قابل للتعديل يوثق كافة العمليات التي تمت في النظام مع اسم المستخدم والتاريخ والوقت.
          </p>
        </div>
        <Link href="/dashboard" className="btn btn-outline">
          ← لوحة التحكم
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1rem' }}>سجل آخر 100 عملية</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            إجمالي السجلات: {logs.length}
          </span>
        </div>

        {logs.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>لا توجد عمليات مسجلة حتى الآن.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>التاريخ والوقت</th>
                  <th>المستخدم المسؤول</th>
                  <th>الدور</th>
                  <th>نوع العملية</th>
                  <th>التفاصيل والملاحظات</th>
                  <th>الرابط</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.createdAt).toLocaleString('ar-EG')}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {log.user ? log.user.name : 'النظام'}
                    </td>
                    <td>
                      {log.user?.role === 'admin' ? (
                        <span className="badge badge-rejected" style={{ fontSize: '0.7rem' }}>مدير</span>
                      ) : log.user?.role === 'doctor' ? (
                        <span className="badge badge-doctor" style={{ fontSize: '0.7rem' }}>طبيب</span>
                      ) : (
                        <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>عضو</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {log.action}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {log.details || '—'}
                    </td>
                    <td>
                      {log.entityType === 'patient' && log.entityId && (
                        <Link href={`/patients/${log.entityId}`} className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                          المريض
                        </Link>
                      )}
                      {log.entityType === 'visit' && log.entityId && (
                        <Link href={`/visits/${log.entityId}`} className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                          الزيارة
                        </Link>
                      )}
                      {log.entityType === 'user' && (
                        <Link href="/admin/users" className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                          المستخدمين
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
