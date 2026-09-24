import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import StatsCard from '@/components/StatsCard'
import StatusBadge from '@/components/StatusBadge'
import { sendToCommittee } from '@/lib/actions/visit-actions'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>
}) {
  const session = await getSession()
  if (!session) return null

  const resolvedParams = searchParams ? await searchParams : {}
  const query = resolvedParams.q?.trim() || ''
  const activeStatus = resolvedParams.status || 'all'

  // Build filter for visits
  const visitFilter: any = {}
  if (activeStatus !== 'all') {
    visitFilter.status = activeStatus
  }

  const [
    totalPatients,
    totalVisits,
    pendingCommittee,
    pendingDoctor,
    approvedCount,
    rejectedCount,
    newCount,
    visits,
    searchResults,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.visit.count(),
    prisma.visit.count({ where: { status: 'committee_review' } }),
    prisma.visit.count({ where: { status: 'doctor_review' } }),
    prisma.visit.count({ where: { status: 'approved' } }),
    prisma.visit.count({ where: { status: 'rejected' } }),
    prisma.visit.count({ where: { status: 'new' } }),
    prisma.visit.findMany({
      where: visitFilter,
      take: 25,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        finalDecision: true,
      },
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
        <div>
          <h1>📊 لوحة متابعة الحالات</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            مرحباً بك {session.name} • {session.role === 'admin' ? 'مدير النظام' : session.role === 'doctor' ? 'طبيب مجمع' : 'عضو لجنة طبية'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/patients/new" className="btn btn-primary">
            ➕ إضافة مريض جديد
          </Link>
        </div>
      </div>

      {/* Interactive Stats Cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <Link href="/dashboard?status=all" style={{ textDecoration: 'none' }}>
          <StatsCard title="إجمالي المرضى" count={totalPatients} color="var(--primary)" />
        </Link>
        <Link href="/dashboard?status=committee_review" style={{ textDecoration: 'none' }}>
          <StatsCard title="في انتظار اللجنة" count={pendingCommittee} color="var(--yellow)" />
        </Link>
        <Link href="/dashboard?status=doctor_review" style={{ textDecoration: 'none' }}>
          <StatsCard title="في انتظار الطبيب" count={pendingDoctor} color="#38bdf8" />
        </Link>
        <Link href="/dashboard?status=approved" style={{ textDecoration: 'none' }}>
          <StatsCard title="تم الصرف" count={approvedCount} color="var(--green)" />
        </Link>
      </div>

      {/* Patient Search Box */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '12px' }}>🔍 البحث السريع عن مريض</h2>
        <form method="get" action="/dashboard" className="search-box" style={{ marginBottom: query ? '16px' : '0' }}>
          <input
            name="q"
            defaultValue={query}
            placeholder="ابحث برقم الملف (مثال: PAT-000001) أو الاسم أو رقم الهاتف..."
          />
          {activeStatus !== 'all' && <input type="hidden" name="status" value={activeStatus} />}
          <button type="submit" className="btn btn-primary">
            بحث
          </button>
          {query && (
            <Link href={`/dashboard${activeStatus !== 'all' ? `?status=${activeStatus}` : ''}`} className="btn btn-outline">
              مسح البحث
            </Link>
          )}
        </form>

        {query && (
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
              نتائج البحث عن "{query}": {searchResults.length} مريض
            </div>
            {searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                <p>لا يوجد مريض مطابق لهذا البحث.</p>
                <Link href="/patients/new" className="btn btn-outline" style={{ marginTop: '12px' }}>
                  ➕ تسجيل هذا المريض الآن
                </Link>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>رقم الملف</th>
                      <th>الاسم</th>
                      <th>الهاتف</th>
                      <th>المحافظة</th>
                      <th>الحالة المادية</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>{p.patientId}</td>
                        <td style={{ fontWeight: 600 }}>{p.fullName}</td>
                        <td>{p.phone || '—'}</td>
                        <td>{p.governorate || '—'}</td>
                        <td>{p.financialStatus || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Link href={`/patients/${p.id}`} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                              📋 فتح الملف
                            </Link>
                            <Link href={`/patients/${p.id}/visits/new`} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                              ➕ زيارة جديدة
                            </Link>
                          </div>
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

      {/* Cases Workspace with Filter Tabs */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.1rem' }}>📋 جدول متابعة الحالات والقرارات</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            إجمالي المعروض: {visits.length} حالة
          </span>
        </div>

        {/* Status Filter Tabs */}
        <div className="tabs">
          <Link
            href={`/dashboard?status=all${query ? `&q=${query}` : ''}`}
            className={`tab-btn ${activeStatus === 'all' ? 'active' : ''}`}
          >
            🌟 الكل ({totalVisits})
          </Link>
          <Link
            href={`/dashboard?status=committee_review${query ? `&q=${query}` : ''}`}
            className={`tab-btn ${activeStatus === 'committee_review' ? 'active' : ''}`}
          >
            🟡 في انتظار اللجنة ({pendingCommittee})
          </Link>
          <Link
            href={`/dashboard?status=doctor_review${query ? `&q=${query}` : ''}`}
            className={`tab-btn ${activeStatus === 'doctor_review' ? 'active' : ''}`}
          >
            🔵 في انتظار الطبيب ({pendingDoctor})
          </Link>
          <Link
            href={`/dashboard?status=approved${query ? `&q=${query}` : ''}`}
            className={`tab-btn ${activeStatus === 'approved' ? 'active' : ''}`}
          >
            🟢 تم الصرف ({approvedCount})
          </Link>
          <Link
            href={`/dashboard?status=rejected${query ? `&q=${query}` : ''}`}
            className={`tab-btn ${activeStatus === 'rejected' ? 'active' : ''}`}
          >
            🔴 مرفوض ({rejectedCount})
          </Link>
          <Link
            href={`/dashboard?status=new${query ? `&q=${query}` : ''}`}
            className={`tab-btn ${activeStatus === 'new' ? 'active' : ''}`}
          >
            🆕 جديدة ({newCount})
          </Link>
        </div>

        {visits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            <p>لا توجد حالات مسجلة في هذا القسم حالياً.</p>
          </div>
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
                  <th>نوع القرار</th>
                  <th>إجراء مباشر</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit) => (
                  <tr key={visit.id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link href={`/patients/${visit.patient.id}`} style={{ color: 'inherit' }}>
                        {visit.patient.fullName}
                      </Link>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {visit.patient.patientId}
                    </td>
                    <td>{visit.specialty}</td>
                    <td><StatusBadge status={visit.status} /></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {new Date(visit.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td>
                      {visit.finalDecision ? (
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {visit.finalDecision.decisionType === 'charity' ? '🟢 كفالة / صدقة' :
                           visit.finalDecision.decisionType === 'paid' ? '🔵 بمقابل مالي' : '🔴 رفض الصرف'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>قيد المعالجة</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {/* Direct Workflow Buttons */}
                        {visit.status === 'committee_review' && (
                          <Link
                            href={`/visits/${visit.id}/committee`}
                            className="btn btn-yellow"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            ✍️ إبداء الرأي
                          </Link>
                        )}

                        {visit.status === 'doctor_review' && (session.role === 'admin' || session.role === 'doctor') && (
                          <Link
                            href={`/visits/${visit.id}/decision`}
                            className="btn btn-green"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            ⚖️ اتخاذ القرار
                          </Link>
                        )}

                        {visit.status === 'new' && (
                          <form action={async () => { 'use server'; await sendToCommittee(visit.id) }}>
                            <button
                              type="submit"
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              📤 للجنة
                            </button>
                          </form>
                        )}

                        {(visit.status === 'approved' || visit.status === 'rejected') && (
                          <Link
                            href={`/visits/${visit.id}/print`}
                            target="_blank"
                            className="btn btn-outline"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            🖨️ التقرير
                          </Link>
                        )}

                        <Link
                          href={`/visits/${visit.id}`}
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="عرض كل التفاصيل"
                        >
                          👁️
                        </Link>
                      </div>
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
