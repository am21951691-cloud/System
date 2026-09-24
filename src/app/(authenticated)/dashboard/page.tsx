import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import StatsCard from '@/components/StatsCard'
import StatusBadge from '@/components/StatusBadge'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>
}) {
  const session = await getSession()
  if (!session) return null

  const resolvedParams = searchParams ? await searchParams : {}
  const query = resolvedParams.q?.trim() || ''

  const [totalPatients, totalVisits, pendingCommittee, pendingDoctor, recentVisits, searchResults] =
    await Promise.all([
      prisma.patient.count(),
      prisma.visit.count(),
      prisma.visit.count({ where: { status: 'committee_review' } }),
      prisma.visit.count({ where: { status: 'doctor_review' } }),
      prisma.visit.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { patient: true },
      }),
      query
        ? prisma.patient.findMany({
            where: {
              OR: [
                { fullName: { contains: query } },
                { patientId: { contains: query } },
                { phone: { contains: query } },
              ],
            },
            take: 20,
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ])

  return (
    <>
      <div className="page-header">
        <h1>📊 لوحة التحكم</h1>
        <Link href="/patients/new" className="btn btn-primary">
          ➕ إضافة مريض جديد
        </Link>
      </div>

      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <StatsCard title="إجمالي المرضى" count={totalPatients} color="var(--primary)" />
        <StatsCard title="إجمالي الزيارات" count={totalVisits} color="#38bdf8" />
        <StatsCard title="في انتظار اللجنة" count={pendingCommittee} color="var(--yellow)" />
        <StatsCard title="في انتظار الطبيب" count={pendingDoctor} color="var(--green)" />
      </div>

      {/* Patient Search Box */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '12px' }}>🔍 البحث عن مريض</h2>
        <form method="get" action="/dashboard" className="search-box" style={{ marginBottom: query ? '16px' : '0' }}>
          <input
            name="q"
            defaultValue={query}
            placeholder="بحث برقم الملف (PAT-000001) أو الاسم أو رقم الهاتف..."
          />
          <button type="submit" className="btn btn-primary">
            بحث
          </button>
          {query && (
            <Link href="/dashboard" className="btn btn-outline">
              مسح
            </Link>
          )}
        </form>

        {query && (
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
              نتائج البحث عن "{query}": {searchResults.length} مريض
            </div>
            {searchResults.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>لا يوجد مريض مطابق لهذا البحث.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>رقم الملف</th>
                      <th>الاسم</th>
                      <th>الهاتف</th>
                      <th>المحافظة</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.patientId}</td>
                        <td style={{ fontWeight: 600 }}>{p.fullName}</td>
                        <td>{p.phone || '—'}</td>
                        <td>{p.governorate || '—'}</td>
                        <td>
                          <Link href={`/patients/${p.id}`} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
                            فتح الملف
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>🕐 آخر الزيارات</h2>

        {recentVisits.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>لا توجد زيارات بعد</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>المريض</th>
                  <th>رقم الملف</th>
                  <th>التخصص</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.map((visit) => (
                  <tr key={visit.id}>
                    <td style={{ fontWeight: 600 }}>{visit.patient.fullName}</td>
                    <td>{visit.patient.patientId}</td>
                    <td>{visit.specialty}</td>
                    <td><StatusBadge status={visit.status} /></td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(visit.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td>
                      <Link href={`/visits/${visit.id}`} className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
                        عرض
                      </Link>
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
