'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

function sanitizeInput(val: unknown, maxLen = 100): string | null {
  if (val === null || val === undefined) return null
  const str = String(val).trim().replace(/\0/g, '')
  return str.length > 0 ? str.slice(0, maxLen) : null
}

export async function createUser(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    throw new Error('غير مصرح لك بإنشاء حسابات - هذه الصلاحية لمدير النظام فقط')
  }

  const username = sanitizeInput(formData.get('username'), 50)
  const name = sanitizeInput(formData.get('name'), 100)
  const password = String(formData.get('password') || '').trim()
  const role = sanitizeInput(formData.get('role'), 20) || 'member'

  if (!username || username.length < 3) {
    throw new Error('اسم المستخدم يجب ألا يقل عن 3 أحرف')
  }
  if (!name) {
    throw new Error('الاسم الكامل مطلوب')
  }
  if (!password || password.length < 6) {
    throw new Error('كلمة المرور يجب ألا تقل عن 6 أحرف')
  }
  if (!['admin', 'doctor', 'member'].includes(role)) {
    throw new Error('نوع الحساب غير صالح')
  }

  // Check for duplicate username
  const existing = await prisma.user.findUnique({
    where: { username },
  })
  if (existing) {
    throw new Error('اسم المستخدم مسجل بالفعل')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      name,
      role,
    },
  })

  await logAudit(
    session.userId,
    'إنشاء حساب مستخدم',
    `تم إنشاء حساب [${user.username}] بدور [${user.role}] بواسطة المدير ${session.name}`,
    'user',
    user.id
  )

  redirect('/admin/users')
}

export async function toggleUserActive(userId: number) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    throw new Error('غير مصرح لك بتعديل حالة الحسابات')
  }

  if (session.userId === userId) {
    throw new Error('لا يمكنك تعطيل حسابك الشخصي أثناء تسجيل الدخول به منعاً لفقدان الوصول للنظام')
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
  })

  await logAudit(
    session.userId,
    updated.active ? 'تفعيل حساب مستخدم' : 'تعطيل حساب مستخدم',
    `قام المدير ${session.name} بـ ${updated.active ? 'تفعيل' : 'تعطيل'} حساب [${user.username}]`,
    'user',
    userId
  )

  redirect('/admin/users')
}
