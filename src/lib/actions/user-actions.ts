'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function createUser(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const hashedPassword = await bcrypt.hash(formData.get('password') as string, 10)

  const user = await prisma.user.create({
    data: {
      username: formData.get('username') as string,
      password: hashedPassword,
      name: formData.get('name') as string,
      role: (formData.get('role') as string) || 'member',
    },
  })

  await logAudit(session.userId, 'إنشاء حساب مستخدم', `تم إنشاء حساب ${user.username}`, 'user', user.id)
  redirect('/admin/users')
}

export async function toggleUserActive(userId: number) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  await prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
  })

  await logAudit(session.userId, user.active ? 'تعطيل حساب' : 'تفعيل حساب', user.username, 'user', userId)
  redirect('/admin/users')
}
