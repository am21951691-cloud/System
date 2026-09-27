import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { buildSpreadsheetML, ExcelRow, ExcelWorksheet } from '@/lib/excel-export'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return new Response('غير مصرح لك بتصدير سجل العمليات الرقابي - هذه الصلاحية لمدير النظام فقط', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // Fetch all audit logs ordered by newest first
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, username: true, role: true },
      },
    },
  })

  // Log this export action itself
  await logAudit(
    session.userId,
    'تصدير سجل العمليات والأثر الرقابي',
    `قام مدير النظام (${session.name}) بتصدير سجل العمليات والأثر الرقابي (${logs.length} سجل) إلى ملف Excel منسق.`,
    'audit'
  )

  const rows: ExcelRow[] = []

  // Row 1: Title Banner
  rows.push({
    height: 38,
    cells: [
      {
        value: '📜 سجل العمليات والأثر الرقابي العام (Audit Log) — نظام إدارة الجمعية الطبية',
        styleId: 'MainTitle',
        mergeAcross: 8,
      },
    ],
  })

  // Row 2: Subtitle Metadata
  const nowArabic = new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' })
  rows.push({
    height: 24,
    cells: [
      {
        value: `تاريخ وساعة التصدير: ${nowArabic}  |  المسؤول المستخرج: ${session.name} (مدير النظام)  |  إجمالي العمليات: ${logs.length}`,
        styleId: 'SubTitle',
        mergeAcross: 8,
      },
    ],
  })

  // Row 3: Table Headers
  rows.push({
    height: 28,
    cells: [
      { value: 'م', styleId: 'Header' },
      { value: 'التاريخ والوقت', styleId: 'Header' },
      { value: 'المستخدم المسؤول', styleId: 'Header' },
      { value: 'اسم المستخدم', styleId: 'Header' },
      { value: 'الدور / الصلاحية', styleId: 'Header' },
      { value: 'نوع العملية', styleId: 'Header' },
      { value: 'الكيان المستهدف', styleId: 'Header' },
      { value: 'رقم الكيان', styleId: 'Header' },
      { value: 'التفاصيل والملاحظات الرقابية', styleId: 'Header' },
    ],
  })

  // Helper for role translation
  const roleLabels: Record<string, string> = {
    admin: 'مدير النظام',
    doctor: 'طبيب معتمد',
    member: 'عضو لجنة طبية',
    accountant: 'محاسب مالي',
  }

  // Helper for entity translation
  const entityLabels: Record<string, string> = {
    patient: 'ملف مريض',
    visit: 'زيارة / حالة',
    user: 'مستخدم',
    audit: 'سجل رقابي',
  }

  // Data rows
  logs.forEach((log, index) => {
    const isAlt = index % 2 === 1
    const centerStyle = isAlt ? 'DataCenterAlt' : 'DataCenter'
    const rightStyle = isAlt ? 'DataRightAlt' : 'DataRight'

    const roleName = log.user ? roleLabels[log.user.role] || log.user.role : 'النظام'
    const entityName = log.entityType ? entityLabels[log.entityType] || log.entityType : '—'

    let roleBadgeStyle = centerStyle
    if (log.user?.role === 'admin') roleBadgeStyle = 'BadgeRejected'
    else if (log.user?.role === 'doctor') roleBadgeStyle = 'BadgeInfo'
    else if (log.user?.role === 'member') roleBadgeStyle = 'BadgeApproved'
    else if (log.user?.role === 'accountant') roleBadgeStyle = 'BadgeWarning'

    rows.push({
      height: 24,
      cells: [
        { value: index + 1, styleId: centerStyle, type: 'Number' },
        {
          value: new Date(log.createdAt).toLocaleString('ar-EG', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          styleId: 'DateCell',
        },
        { value: log.user ? log.user.name : 'النظام الآلي', styleId: centerStyle },
        { value: log.user ? log.user.username : 'system', styleId: centerStyle },
        { value: roleName, styleId: roleBadgeStyle },
        { value: log.action, styleId: isAlt ? 'DataRightAlt' : 'DataRight' },
        { value: entityName, styleId: centerStyle },
        { value: log.entityId ? `#${log.entityId}` : '—', styleId: centerStyle },
        { value: log.details || '—', styleId: rightStyle },
      ],
    })
  })

  const worksheet: ExcelWorksheet = {
    name: 'سجل العمليات والأثر الرقابي',
    columns: [
      { width: 45 },  // م
      { width: 140 }, // التاريخ والوقت
      { width: 130 }, // المستخدم المسؤول
      { width: 100 }, // اسم المستخدم
      { width: 110 }, // الدور
      { width: 160 }, // نوع العملية
      { width: 95 },  // الكيان
      { width: 75 },  // رقم الكيان
      { width: 380 }, // التفاصيل
    ],
    rows,
    freezeRows: 3,
  }

  const xml = buildSpreadsheetML([worksheet])
  const filename = `audit_log_${new Date().toISOString().slice(0, 10)}.xls`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
