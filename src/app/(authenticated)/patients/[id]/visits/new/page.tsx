import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { createVisit } from '@/lib/actions/visit-actions'
import Link from 'next/link'
import MedicationForm from '@/components/MedicationForm'

export default async function NewVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(id) },
  })

  if (!patient) return notFound()

  const createVisitWithPatient = createVisit.bind(null, patient.id)

  return (
    <>
      <div className="page-header">
        <h1>➕ إضافة زيارة — {patient.fullName}</h1>
        <Link href={`/patients/${patient.id}`} className="btn btn-outline">
          ← العودة
        </Link>
      </div>

      <form action={createVisitWithPatient}>
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '16px' }}>📝 بيانات الزيارة</h2>
          <div className="grid-2">
            <div className="form-group">
              <label>التخصص *</label>
              <select name="specialty" required>
                <option value="">اختر التخصص</option>
                <option value="باطنة">باطنة</option>
                <option value="جراحة">جراحة</option>
                <option value="عظام">عظام</option>
                <option value="قلب">قلب</option>
                <option value="أطفال">أطفال</option>
                <option value="نساء وتوليد">نساء وتوليد</option>
                <option value="عيون">عيون</option>
                <option value="أنف وأذن">أنف وأذن</option>
                <option value="جلدية">جلدية</option>
                <option value="أسنان">أسنان</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div className="form-group">
              <label>الحالة العامة</label>
              <input name="generalCondition" placeholder="مثال: مستقر" />
            </div>
          </div>
          <div className="form-group">
            <label>التشخيص</label>
            <textarea name="diagnosis" rows={2}></textarea>
          </div>
          <div className="form-group">
            <label>وصف الحالة</label>
            <textarea name="description" rows={3}></textarea>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <MedicationForm />
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1, minWidth: '220px', justifyContent: 'center' }}>
            ✅ حفظ الزيارة والروشتة
          </button>
          <Link href={`/patients/${patient.id}`} className="btn btn-outline" style={{ minWidth: '120px' }}>
            إلغاء
          </Link>
        </div>
      </form>
    </>
  )
}
