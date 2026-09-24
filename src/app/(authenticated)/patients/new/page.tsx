import { createPatient } from '@/lib/actions/patient-actions'
import Link from 'next/link'

export default function NewPatientPage() {
  return (
    <>
      <div className="page-header">
        <h1>➕ إضافة مريض جديد</h1>
        <Link href="/dashboard" className="btn btn-outline">
          ← العودة
        </Link>
      </div>

      <div className="card">
        <form action={createPatient}>
          <div className="grid-2">
            <div className="form-group">
              <label>الاسم الكامل *</label>
              <input name="fullName" required />
            </div>
            <div className="form-group">
              <label>رقم الهاتف</label>
              <input name="phone" type="tel" />
            </div>
            <div className="form-group">
              <label>الجنس</label>
              <select name="gender">
                <option value="">اختر</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>
            </div>
            <div className="form-group">
              <label>تاريخ الميلاد / السن</label>
              <input name="birthDate" placeholder="مثال: 45 سنة أو 1980-05-12" />
            </div>
            <div className="form-group">
              <label>المحافظة</label>
              <input name="governorate" />
            </div>
            <div className="form-group">
              <label>المدينة</label>
              <input name="city" />
            </div>
            <div className="form-group">
              <label>الحالة الاجتماعية</label>
              <select name="maritalStatus">
                <option value="">اختر</option>
                <option value="أعزب">أعزب</option>
                <option value="متزوج">متزوج</option>
                <option value="مطلق">مطلق</option>
                <option value="أرمل">أرمل</option>
              </select>
            </div>
            <div className="form-group">
              <label>الحالة المادية</label>
              <select name="financialStatus">
                <option value="">اختر</option>
                <option value="ميسور">ميسور</option>
                <option value="متوسط">متوسط</option>
                <option value="محدود الدخل">محدود الدخل</option>
                <option value="معدوم الدخل">معدوم الدخل</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>العنوان التفصيلي</label>
            <textarea name="address" rows={2}></textarea>
          </div>
          <div className="form-group">
            <label>ملاحظات</label>
            <textarea name="notes" rows={2}></textarea>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
            ✅ حفظ المريض
          </button>
        </form>
      </div>
    </>
  )
}
