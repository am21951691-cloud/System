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
  const isPatientsView = activeStatus === 'patients'

  // Build filter for visits
  const visitFilter: any = {}
  if (activeStatus !== 'all' && !isPatientsView) {
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
    patientsList,
    searchResults,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.visit.count(),
    prisma.visit.count({ where: { status: 'committee_review' } }),
    prisma.visit.count({ where: { status: 'doctor_review' } }),
    prisma.visit.count({ where: { status: 'approved' } }),
    prisma.visit.count({ where: { status: 'rejected' } }),
    prisma.visit.count({ where: { status: 'new' } }),
    !isPatientsView
      ? prisma.visit.findMany({
          where: visitFilter,
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: true,
            finalDecision: true,
          },
        })
      : Promise.resolve([]),
    isPatientsView
      ? prisma.patient.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            visits: {
              select: { id: true, status: true, specialty: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        })
      : Promise.resolve([]),
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
            مرحباً بك د. {session.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/patients/new" className="btn btn-primary">
            ➕ إضافة مريض جديد وروشتة
          </Link>
        </div>
      </div>

      {/* Interactive Stats Cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <Link href="/dashboard?status=patients" style={{ textDecoration: 'none' }}>
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
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <Link href={`/patients/${p.id}`} className="btn btn-sm btn-primary">
                              📋 فتح الملف
                            </Link>
                            <Link href={`/patients/${p.id}/visits/new`} className="btn btn-sm btn-outline">
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
          <h2 style={{ fontSize: '1.1rem' }}>
            {isPatientsView ? '👥 سجل المرضى المسجلين' : '📋 جدول متابعة الحالات والقرارات'}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isPatientsView
              ? `إجمالي المسجلين: ${patientsList.length} مريض`
              : `إجمالي المعروض: ${visits.length} حالة`}
          </span>
        </div>

        {/* Status Filter Tabs */}
        <div className="tabs">
          <Link
            href={`/dashboard?status=all${query ? `&q=${query}` : ''}`}
            className={`tab-btn ${activeStatus === 'all' ? 'active' : ''}`}
          >
            🌟 كل الحالات ({totalVisits})
          </Link>
          <Link
            href={`/dashboard?status=patients${query ? `&q=${query}` : ''}`}
            className={`tab-btn ${activeStatus === 'patients' ? 'active' : ''}`}
          >
            👥 المرضى المسجلين ({totalPatients})
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
            🆕 مسودة / جديدة ({newCount})
          </Link>
        </div>

        {/* VIEW 1: PATIENTS LIST VIEW */}
        {isPatientsView ? (
          patientsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
              <p>لا يوجد مرضى مسجلين حتى الآن.</p>
              <Link href="/patients/new" className="btn btn-primary" style={{ marginTop: '12px' }}>
                ➕ تسجيل مريض جديد
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>رقم الملف</th>
                    <th>الاسم بالكامل</th>
                    <th>الهاتف</th>
                    <th>المدينة / المحافظة</th>
                    <th>الحالة المادية</th>
                    <th>تاريخ التسجيل</th>
                    <th>آخر حالة</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {patientsList.map((p) => {
                    const latestVisit = p.visits[0]
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
                          {p.patientId}
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.fullName}</td>
                        <td>{p.phone || '—'}</td>
                        <td>{p.city || p.governorate || '—'}</td>
                        <td>{p.financialStatus || '—'}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {new Date(p.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td>
                          {latestVisit ? (
                            <StatusBadge status={latestVisit.status} />
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>بدون زيارات</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <Link
                              href={`/patients/${p.id}`}
                              className="btn btn-sm btn-primary"
                            >
                              📋 الملف
                            </Link>
                            <Link
                              href={`/patients/${p.id}/visits/new`}
                              className="btn btn-sm btn-outline"
                            >
                              ➕ زيارة جديدة
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* VIEW 2: VISITS AND DECISIONS VIEW */
          visits.length === 0 ? (
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
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Direct Workflow Buttons */}
                          {visit.status === 'committee_review' && (
                            <Link
                              href={`/visits/${visit.id}/committee`}
                              className="btn btn-sm btn-yellow"
                            >
                              ✍️ إبداء الرأي
                            </Link>
                          )}

                          {visit.status === 'doctor_review' && (
                            <Link
                              href={`/visits/${visit.id}/decision`}
                              className="btn btn-sm btn-green"
                            >
                              ⚖️ اتخاذ القرار
                            </Link>
                          )}

                          {visit.status === 'new' && (
                            <form action={async () => { 'use server'; await sendToCommittee(visit.id) }}>
                              <button
                                type="submit"
                                className="btn btn-sm btn-outline"
                              >
                                📤 للجنة
                              </button>
                            </form>
                          )}

                          {(visit.status === 'approved' || visit.status === 'rejected') && (
                            <Link
                              href={`/visits/${visit.id}/print`}
                              target="_blank"
                              className="btn btn-sm btn-outline"
                            >
                              🖨️ التقرير
                            </Link>
                          )}

                          <Link
                            href={`/visits/${visit.id}`}
                            className="btn btn-sm btn-outline"
                            title="عرض كل التفاصيل"
                          >
                            👁️ التفاصيل
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </>
  )
}
