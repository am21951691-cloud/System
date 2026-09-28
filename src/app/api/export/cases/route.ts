import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { buildSpreadsheetML, ExcelRow, ExcelWorksheet } from '@/lib/excel-export'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return new Response('يجب تسجيل الدخول أولاً للوصول إلى هذا التقرير', {
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const { searchParams } = new URL(request.url)
  const activeStatus = searchParams.get('status') || 'all'
  const isPatientsOnly = activeStatus === 'patients'

  // Translation helpers
  const statusLabels: Record<string, string> = {
    new: 'جديدة / مسودة',
    committee_review: 'في انتظار اللجنة',
    doctor_review: 'في انتظار الطبيب',
    approved: 'تم الصرف (موافقة)',
    rejected: 'لا يصرف (مرفوض)',
  }

  const committeeDecisionLabels: Record<string, string> = {
    charity: 'يصرف صدقة',
    zakat: 'يصرف زكاة مال',
    paid: 'يصرف بمقابل مالي',
    denied: 'لا يصرف (مرفوض)',
  }

  // ==========================================
  // CASE 1: PATIENTS ROSTER EXPORT
  // ==========================================
  if (isPatientsOnly) {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        visits: {
          select: { id: true, status: true, specialty: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    await logAudit(
      session.userId,
      'تصدير سجل المرضى',
      `قام المستخدم (${session.name}) بتصدير سجل بيانات المرضى (${patients.length} مريض) إلى ملف Excel.`,
      'patient'
    )

    const rows: ExcelRow[] = []

    // Title & Subtitle
    rows.push({
      height: 38,
      cells: [
        {
          value: '👥 سجل بيانات المرضى المسجلين بالكامل — نظام إدارة الجمعية الطبية',
          styleId: 'MainTitle',
          mergeAcross: 13,
        },
      ],
    })

    const nowArabic = new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' })
    rows.push({
      height: 24,
      cells: [
        {
          value: `تاريخ وساعة التصدير: ${nowArabic}  |  المسؤول المستخرج: ${session.name} (${session.role})  |  إجمالي المرضى: ${patients.length}`,
          styleId: 'SubTitle',
          mergeAcross: 13,
        },
      ],
    })

    // Headers
    rows.push({
      height: 28,
      cells: [
        { value: 'م', styleId: 'Header' },
        { value: 'رقم ملف المريض', styleId: 'Header' },
        { value: 'الاسم بالكامل', styleId: 'Header' },
        { value: 'رقم الهاتف', styleId: 'Header' },
        { value: 'تاريخ الميلاد / السن', styleId: 'Header' },
        { value: 'النوع / الجنس', styleId: 'Header' },
        { value: 'المحافظة', styleId: 'Header' },
        { value: 'المدينة / المركز', styleId: 'Header' },
        { value: 'العنوان بالتفصيل', styleId: 'Header' },
        { value: 'الحالة الاجتماعية', styleId: 'Header' },
        { value: 'اسم الزوج / الزوجة', styleId: 'Header' },
        { value: 'الحالة المادية والاجتماعية', styleId: 'Header' },
        { value: 'عدد الزيارات والروشتات', styleId: 'Header' },
        { value: 'تاريخ التسجيل بالمنظومة', styleId: 'Header' },
      ],
    })

    patients.forEach((p, idx) => {
      const isAlt = idx % 2 === 1
      const centerStyle = isAlt ? 'DataCenterAlt' : 'DataCenter'
      const rightStyle = isAlt ? 'DataRightAlt' : 'DataRight'

      rows.push({
        height: 24,
        cells: [
          { value: idx + 1, styleId: centerStyle, type: 'Number' },
          { value: p.patientId, styleId: 'IdCell' },
          { value: p.fullName, styleId: rightStyle },
          { value: p.phone || '—', styleId: centerStyle },
          { value: p.birthDate || '—', styleId: centerStyle },
          { value: p.gender === 'female' ? 'أنثى' : p.gender === 'male' ? 'ذكر' : p.gender || '—', styleId: centerStyle },
          { value: p.governorate || '—', styleId: centerStyle },
          { value: p.city || '—', styleId: centerStyle },
          { value: p.address || '—', styleId: rightStyle },
          { value: p.maritalStatus || '—', styleId: centerStyle },
          { value: p.spouseName || '—', styleId: rightStyle },
          { value: p.financialStatus || '—', styleId: centerStyle },
          { value: p.visits.length, styleId: centerStyle, type: 'Number' },
          {
            value: new Date(p.createdAt).toLocaleDateString('ar-EG'),
            styleId: 'DateCell',
          },
        ],
      })
    })

    const worksheet: ExcelWorksheet = {
      name: 'سجل المرضى',
      columns: [
        { width: 45 },  // م
        { width: 110 }, // رقم الملف
        { width: 180 }, // الاسم
        { width: 110 }, // الهاتف
        { width: 110 }, // السن
        { width: 80 },  // النوع
        { width: 100 }, // المحافظة
        { width: 100 }, // المدينة
        { width: 220 }, // العنوان
        { width: 100 }, // الاجتماعية
        { width: 140 }, // اسم الزوج/الزوجة
        { width: 130 }, // المادية
        { width: 110 }, // الزيارات
        { width: 110 }, // تاريخ التسجيل
      ],
      rows,
      freezeRows: 3,
    }

    const xml = buildSpreadsheetML([worksheet])
    const filename = `patients_directory_${new Date().toISOString().slice(0, 10)}.xls`

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  }

  // ========================================================
  // CASE 2: CASES AND FINAL DECISIONS DETAILED EXPORT
  // ========================================================
  const visitFilter: any = {}
  if (activeStatus !== 'all') {
    visitFilter.status = activeStatus
  }

  const visits = await prisma.visit.findMany({
    where: visitFilter,
    orderBy: { createdAt: 'desc' },
    include: {
      patient: true,
      finalDecision: true,
      medications: true,
      committeeReviews: {
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  await logAudit(
    session.userId,
    'تصدير كشف الحالات والقرارات',
    `قام المستخدم (${session.name}) بتصدير كشف متابعة الحالات والقرارات (${visits.length} حالة) إلى ملف Excel.`,
    'visit'
  )

  const isMember = session.role === 'member'
  const isAccountant = session.role === 'accountant'

  const casesRows: ExcelRow[] = []

  // Row 1: Title Banner
  casesRows.push({
    height: 38,
    cells: [
      {
        value: '📋 جدول متابعة الحالات والقرارات الطبية الشامل — نظام إدارة الجمعية الطبية',
        styleId: 'MainTitle',
        mergeAcross: 27,
      },
    ],
  })

  // Row 2: Subtitle Metadata
  const nowArabic = new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' })
  const filterDesc =
    activeStatus === 'all'
      ? 'كافة الحالات والقرارات'
      : `الحالات المصفاة حسب: [${statusLabels[activeStatus] || activeStatus}]`

  casesRows.push({
    height: 24,
    cells: [
      {
        value: `تاريخ التصدير: ${nowArabic}  |  المسؤول: ${session.name} (${session.role})  |  النطاق: ${filterDesc} (${visits.length} حالة)`,
        styleId: 'SubTitle',
        mergeAcross: 27,
      },
    ],
  })

  // Row 3: Headers
  casesRows.push({
    height: 30,
    cells: [
      { value: 'م', styleId: 'Header' },
      // Patient Demographics
      { value: 'رقم ملف المريض', styleId: 'Header' },
      { value: 'اسم المريض بالكامل', styleId: 'Header' },
      { value: 'رقم الهاتف', styleId: 'Header' },
      { value: 'تاريخ الميلاد / السن', styleId: 'Header' },
      { value: 'النوع / الجنس', styleId: 'Header' },
      { value: 'المحافظة', styleId: 'Header' },
      { value: 'المدينة / المركز', styleId: 'Header' },
      { value: 'العنوان التفصيلي', styleId: 'Header' },
      { value: 'الحالة الاجتماعية', styleId: 'Header' },
      { value: 'اسم الزوج / الزوجة', styleId: 'Header' },
      { value: 'الحالة المادية', styleId: 'Header' },
      // Visit Details
      { value: 'رقم الزيارة', styleId: 'Header' },
      { value: 'تاريخ الزيارة', styleId: 'Header' },
      { value: 'التخصص الطبي', styleId: 'Header' },
      { value: 'مرحلة الحالة', styleId: 'Header' },
      { value: 'الحالة العامة للمريض', styleId: 'Header' },
      { value: 'التشخيص الطبي السريري', styleId: 'Header' },
      { value: 'الشكوى والوصف السريري', styleId: 'Header' },
      { value: 'مرفق صورة روشتة؟', styleId: 'Header' },
      // Committee Reviews
      { value: 'آراء وتوصيات اللجنة الطبية', styleId: 'Header' },
      // Doctor Final Decision
      { value: 'قرار الطبيب النهائي', styleId: 'Header' },
      { value: 'الطبيب المعتمد', styleId: 'Header' },
      { value: 'مدة الصرف المعتمدة', styleId: 'Header' },
      { value: 'الكمية لكل صرف', styleId: 'Header' },
      { value: 'جدول ومواعيد الصرف', styleId: 'Header' },
      { value: 'توجيهات وملاحظات الطبيب', styleId: 'Header' },
      // Prescribed Medications
      { value: 'ملخص تفريغ الأدوية المعتمدة', styleId: 'Header' },
    ],
  })

  // Build Cases Data Rows
  visits.forEach((v, idx) => {
    const isAlt = idx % 2 === 1
    const centerStyle = isAlt ? 'DataCenterAlt' : 'DataCenter'
    const rightStyle = isAlt ? 'DataRightAlt' : 'DataRight'

    // Status Badge Style
    let statusBadgeStyle = centerStyle
    if (v.status === 'approved') statusBadgeStyle = 'BadgeApproved'
    else if (v.status === 'rejected') statusBadgeStyle = 'BadgeRejected'
    else if (v.status === 'committee_review') statusBadgeStyle = 'BadgeWarning'
    else if (v.status === 'doctor_review') statusBadgeStyle = 'BadgeInfo'

    // Medical Redaction for Accountant
    const generalConditionVal = isAccountant ? '🔒 محجوب (صلاحية محاسب)' : v.generalCondition || '—'
    const diagnosisVal = isAccountant ? '🔒 محجوب (صلاحية محاسب)' : v.diagnosis || '—'
    const descriptionVal = isAccountant ? '🔒 محجوب (صلاحية محاسب)' : v.description || '—'

    // Committee Reviews Formatting & Blind Review Enforcement
    let committeeSummary = 'لا توجد آراء مسجلة حتى الآن'
    if (v.committeeReviews && v.committeeReviews.length > 0) {
      if (isMember) {
        // Blind review: Member only sees their own recommendation
        const ownReview = v.committeeReviews.find((r) => r.user?.id === session.userId)
        if (ownReview) {
          const dec = committeeDecisionLabels[ownReview.decision] || ownReview.decision
          committeeSummary = `رأيك المسجل: [${dec}]${ownReview.notes ? ` - ${ownReview.notes}` : ''}`
        } else {
          committeeSummary = 'لم تقم بتسجيل رأيك بعد (مداولات الأعضاء الآخرين سرية)'
        }
      } else {
        // Doctor, Admin, Accountant see full breakdown
        const reviewsText = v.committeeReviews
          .map((r, rIdx) => {
            const dec = committeeDecisionLabels[r.decision] || r.decision
            return `${rIdx + 1}) ${r.user?.name || 'عضو'}: [${dec}]${r.notes ? ` (${r.notes})` : ''}`
          })
          .join('\n')
        committeeSummary = reviewsText
      }
    }

    // Doctor Final Decision Formatting
    let doctorDecisionLabel = 'قيد المراجعة والانتظار'
    let decisionBadgeStyle = centerStyle
    if (v.finalDecision) {
      if (v.finalDecision.decisionType === 'approved') {
        doctorDecisionLabel = '🟢 يستحق الصرف (موافقة)'
        decisionBadgeStyle = 'BadgeApproved'
      } else if (
        v.finalDecision.decisionType === 'rejected' ||
        v.finalDecision.decisionType === 'denied'
      ) {
        doctorDecisionLabel = '🔴 لا يستحق الصرف (رفض)'
        decisionBadgeStyle = 'BadgeRejected'
      } else {
        doctorDecisionLabel = v.finalDecision.decisionType
      }
    }

    // Medications Formatting & Member Redaction
    let medsSummary = 'لا توجد أدوية مدرجة'
    if (isMember) {
      medsSummary = '🔒 محجوب عن أعضاء اللجنة (سرية الروشتة وتفريغ الطبيب)'
    } else if (v.medications && v.medications.length > 0) {
      medsSummary = v.medications
        .map((m, mIdx) => {
          const parts = [
            `${mIdx + 1}) ${m.name}`,
            m.concentration ? `(${m.concentration})` : '',
            m.dosage ? `- الجرعة: ${m.dosage}` : '',
            m.frequency ? `- التكرار: ${m.frequency}` : '',
            m.duration ? `- المدة: ${m.duration}` : '',
            m.dispenseInterval ? `- فترة الصرف: ${m.dispenseInterval}` : '',
            m.quantity ? `- كمية الصرف: ${m.quantity}` : '',
            m.totalQuantity ? `- الإجمالي: ${m.totalQuantity}` : '',
            m.notes ? `- ملاحظات: ${m.notes}` : '',
          ]
            .filter(Boolean)
            .join(' ')
          return parts
        })
        .join('\n')
    }

    casesRows.push({
      height: 26,
      cells: [
        { value: idx + 1, styleId: centerStyle, type: 'Number' },
        // Patient
        { value: v.patient.patientId, styleId: 'IdCell' },
        { value: v.patient.fullName, styleId: rightStyle },
        { value: v.patient.phone || '—', styleId: centerStyle },
        { value: v.patient.birthDate || '—', styleId: centerStyle },
        {
          value:
            v.patient.gender === 'female'
              ? 'أنثى'
              : v.patient.gender === 'male'
              ? 'ذكر'
              : v.patient.gender || '—',
          styleId: centerStyle,
        },
        { value: v.patient.governorate || '—', styleId: centerStyle },
        { value: v.patient.city || '—', styleId: centerStyle },
        { value: v.patient.address || '—', styleId: rightStyle },
        { value: v.patient.maritalStatus || '—', styleId: centerStyle },
        { value: v.patient.spouseName || '—', styleId: rightStyle },
        { value: v.patient.financialStatus || '—', styleId: centerStyle },
        // Visit
        { value: `#${v.id}`, styleId: centerStyle },
        {
          value: new Date(v.date || v.createdAt).toLocaleDateString('ar-EG'),
          styleId: 'DateCell',
        },
        { value: v.specialty, styleId: centerStyle },
        { value: statusLabels[v.status] || v.status, styleId: statusBadgeStyle },
        { value: generalConditionVal, styleId: isAccountant ? 'RedactedCell' : rightStyle },
        { value: diagnosisVal, styleId: isAccountant ? 'RedactedCell' : rightStyle },
        { value: descriptionVal, styleId: isAccountant ? 'RedactedCell' : rightStyle },
        { value: v.prescriptionImage ? '📸 نعم (مرفقة)' : '❌ بدون صورة', styleId: centerStyle },
        // Committee
        { value: committeeSummary, styleId: rightStyle },
        // Final Decision
        { value: doctorDecisionLabel, styleId: decisionBadgeStyle },
        { value: v.finalDecision?.doctorName || '—', styleId: centerStyle },
        { value: v.finalDecision?.dispenseDuration || '—', styleId: centerStyle },
        { value: v.finalDecision?.dispenseQuantity || '—', styleId: centerStyle },
        { value: v.finalDecision?.dispenseSchedule || '—', styleId: centerStyle },
        { value: v.finalDecision?.reason || '—', styleId: rightStyle },
        // Meds
        { value: medsSummary, styleId: isMember ? 'RedactedCell' : rightStyle },
      ],
    })
  })

  const worksheets: ExcelWorksheet[] = [
    {
      name: 'جدول متابعة الحالات والقرارات',
      columns: [
        { width: 40 },  // م
        { width: 105 }, // رقم الملف
        { width: 170 }, // اسم المريض
        { width: 110 }, // الهاتف
        { width: 100 }, // السن
        { width: 75 },  // النوع
        { width: 95 },  // المحافظة
        { width: 95 },  // المدينة
        { width: 180 }, // العنوان
        { width: 95 },  // الاجتماعية
        { width: 140 }, // اسم الزوج / الزوجة
        { width: 120 }, // المادية
        { width: 75 },  // رقم الزيارة
        { width: 100 }, // تاريخ الزيارة
        { width: 110 }, // التخصص
        { width: 125 }, // الحالة
        { width: 140 }, // الحالة العامة
        { width: 180 }, // التشخيص
        { width: 180 }, // الشكوى
        { width: 95 },  // روشتة
        { width: 280 }, // اللجنة
        { width: 135 }, // قرار الطبيب
        { width: 120 }, // الطبيب المعتمد
        { width: 110 }, // مدة الصرف
        { width: 110 }, // الكمية لكل صرف
        { width: 120 }, // جدول الصرف
        { width: 220 }, // توجيهات الطبيب
        { width: 340 }, // تفريغ الأدوية
      ],
      rows: casesRows,
      freezeRows: 3,
    },
  ]

  // ========================================================
  // WORKSHEET 2: DETAILED ITEM-BY-ITEM PHARMACY DISPENSING
  // (Available for Doctor, Admin, Accountant)
  // ========================================================
  if (!isMember) {
    const pharmacyRows: ExcelRow[] = []

    // Title & Subtitle
    pharmacyRows.push({
      height: 38,
      cells: [
        {
          value: '💊 تفريغ الأدوية وجدول صرف الصيدلية — نظام إدارة الجمعية الطبية',
          styleId: 'MainTitle',
          mergeAcross: 14,
        },
      ],
    })

    pharmacyRows.push({
      height: 24,
      cells: [
        {
          value: `تاريخ التصدير: ${nowArabic}  |  المسؤول: ${session.name} (${session.role})  |  خاص بإدارة الصيدلية وصرف الأدوية والمحاسب`,
          styleId: 'SubTitle',
          mergeAcross: 14,
        },
      ],
    })

    // Pharmacy Headers
    pharmacyRows.push({
      height: 28,
      cells: [
        { value: 'م', styleId: 'HeaderGreen' },
        { value: 'رقم ملف المريض', styleId: 'HeaderGreen' },
        { value: 'اسم المريض', styleId: 'HeaderGreen' },
        { value: 'رقم الهاتف', styleId: 'HeaderGreen' },
        { value: 'رقم الزيارة', styleId: 'HeaderGreen' },
        { value: 'اسم الدواء المعتمد', styleId: 'HeaderGreen' },
        { value: 'التركيز', styleId: 'HeaderGreen' },
        { value: 'الجرعة / الشكل الدوائي', styleId: 'HeaderGreen' },
        { value: 'طريقة الاستخدام', styleId: 'HeaderGreen' },
        { value: 'التكرار', styleId: 'HeaderGreen' },
        { value: 'مدة العلاج', styleId: 'HeaderGreen' },
        { value: 'فترة التكرار / الصرف الدوري', styleId: 'HeaderGreen' },
        { value: 'الكمية لكل صرف', styleId: 'HeaderGreen' },
        { value: 'إجمالي الكمية المقررة', styleId: 'HeaderGreen' },
        { value: 'ملاحظات وتوجيهات الصنف', styleId: 'HeaderGreen' },
      ],
    })

    let medCounter = 0
    visits.forEach((v) => {
      if (v.medications && v.medications.length > 0) {
        v.medications.forEach((m) => {
          medCounter++
          const isAlt = medCounter % 2 === 1
          const centerStyle = isAlt ? 'DataCenterAlt' : 'DataCenter'
          const rightStyle = isAlt ? 'DataRightAlt' : 'DataRight'

          pharmacyRows.push({
            height: 24,
            cells: [
              { value: medCounter, styleId: centerStyle, type: 'Number' },
              { value: v.patient.patientId, styleId: 'IdCell' },
              { value: v.patient.fullName, styleId: rightStyle },
              { value: v.patient.phone || '—', styleId: centerStyle },
              { value: `#${v.id}`, styleId: centerStyle },
              { value: m.name, styleId: 'BadgeApproved' },
              { value: m.concentration || '—', styleId: centerStyle },
              { value: m.dosage || '—', styleId: centerStyle },
              { value: m.usageMethod || '—', styleId: centerStyle },
              { value: m.frequency || '—', styleId: centerStyle },
              { value: m.duration || '—', styleId: centerStyle },
              { value: m.dispenseInterval || '—', styleId: centerStyle },
              { value: m.quantity || '—', styleId: centerStyle },
              { value: m.totalQuantity || '—', styleId: centerStyle },
              { value: m.notes || '—', styleId: rightStyle },
            ],
          })
        })
      }
    })

    if (medCounter === 0) {
      pharmacyRows.push({
        height: 28,
        cells: [
          {
            value: 'لا توجد أدوية معتمدة مفرغة في الحالات المحددة حتى الآن.',
            styleId: 'DataCenter',
            mergeAcross: 14,
          },
        ],
      })
    }

    worksheets.push({
      name: 'تفاصيل الأدوية والصيدلية',
      columns: [
        { width: 45 },  // م
        { width: 105 }, // رقم الملف
        { width: 170 }, // اسم المريض
        { width: 110 }, // الهاتف
        { width: 80 },  // رقم الزيارة
        { width: 160 }, // اسم الدواء
        { width: 100 }, // التركيز
        { width: 120 }, // الجرعة
        { width: 130 }, // طريقة الاستخدام
        { width: 110 }, // التكرار
        { width: 100 }, // المدة
        { width: 130 }, // فترة الصرف
        { width: 110 }, // الكمية لكل صرف
        { width: 110 }, // إجمالي الكمية
        { width: 220 }, // ملاحظات الصنف
      ],
      rows: pharmacyRows,
      freezeRows: 3,
    })
  }

  const xml = buildSpreadsheetML(worksheets)
  const filename = `cases_decisions_${activeStatus}_${new Date().toISOString().slice(0, 10)}.xls`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
