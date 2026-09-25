import { createPatient } from '@/lib/actions/patient-actions'
import MedicationForm from '@/components/MedicationForm'
import Link from 'next/link'

export default function NewPatientPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>➕ إضافة مريض جديد وروشتة</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            تسجيل ملف المريض وبيانات الكشف والروشتة في خطوة واحدة
          </p>
        </div>
        <Link href="/dashboard" className="btn btn-outline">
          ← العودة للوحة المتابعة
        </Link>
      </div>

      <form action={createPatient} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Patient Information */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>👤</span>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>البيانات الأساسية للمريض</h2>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>الاسم بالكامل *</label>
              <input name="fullName" required placeholder="مثال: محمد أحمد إبراهيم" />
            </div>
            <div className="form-group">
              <label>رقم الهاتف</label>
              <input name="phone" type="tel" placeholder="01xxxxxxxxx" />
            </div>
            <div className="form-group">
              <label>الجنس</label>
              <select name="gender">
                <option value="">اختر الجنس</option>
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
              <input name="governorate" placeholder="مثال: القاهرة" />
            </div>
            <div className="form-group">
              <label>المدينة / المركز</label>
              <input name="city" placeholder="مثال: التجمع الخامس" />
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
            <textarea name="address" rows={2} placeholder="الشارع، رقم العقار، علامة مميزة..."></textarea>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>ملاحظات إضافية حول المريض أو الأسرة</label>
            <textarea name="notes" rows={2} placeholder="أي ظروف خاصة أو معلومات اجتماعية..."></textarea>
          </div>
        </div>

        {/* Section 2: Visit & Diagnosis */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🩺</span>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>بيانات الكشف والحالة الطبية</h2>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>التخصص الطبي *</label>
              <select name="specialty" required defaultValue="باطنة">
                <option value="باطنة">باطنة</option>
                <option value="عظام">عظام</option>
                <option value="أطفال">أطفال</option>
                <option value="جلدية وتجميل">جلدية وتجميل</option>
                <option value="نساء وتوليد">نساء وتوليد</option>
                <option value="عيون">عيون</option>
                <option value="أنف وأذن">أنف وأذن</option>
                <option value="أسنان">أسنان</option>
                <option value="قلب وأوعية دموية">قلب وأوعية دموية</option>
                <option value="مخ وأعصاب">مخ وأعصاب</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div className="form-group">
              <label>الحالة العامة للمريض</label>
              <input name="generalCondition" placeholder="مثال: مستقرة، مرض مزمن، طارئة..." />
            </div>
          </div>

          <div className="form-group">
            <label>التشخيص الطبي / المشكلة الرئيسية</label>
            <input name="diagnosis" placeholder="مثال: التهاب مفاصل مزمن / سكر من النوع الثاني" />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>وصف الحالة وتفاصيل الكشف</label>
            <textarea name="description" rows={2} placeholder="تقرير الفحص، الشكوى الرئيسية، الملاحظات الطبية..."></textarea>
          </div>
        </div>

        {/* Section 3: Prescription Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>💊</span>
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>الروشتة وقائمة الأدوية المطلوبة</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
                أدخل الأدوية الموصوفة والجرعات وكميات الصرف المقترحة
              </p>
            </div>
          </div>

          <MedicationForm />
        </div>

        {/* Action Buttons */}
        <div className="card" style={{ display: 'flex', gap: '14px', justifyContent: 'flex-start', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="submit"
            name="targetStatus"
            value="committee_review"
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 700 }}
          >
            🚀 حفظ المريض والروشتة وإرسالها للجنة مباشرة
          </button>

          <button
            type="submit"
            name="targetStatus"
            value="new"
            className="btn btn-outline"
            style={{ padding: '14px 22px', fontSize: '0.95rem' }}
          >
            💾 حفظ كحالة جديدة (مسودة)
          </button>

          <Link href="/dashboard" className="btn btn-outline" style={{ padding: '14px 22px' }}>
            إلغاء
          </Link>
        </div>
      </form>
    </>
  )
}
