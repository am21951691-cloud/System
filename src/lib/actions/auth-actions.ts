'use server'

import { prisma } from '@/lib/db'
import { createSession, deleteSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'يرجى إدخال اسم المستخدم وكلمة المرور' }
  }

  const user = await prisma.user.findUnique({ where: { username } })

  if (!user || !user.active) {
    return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
  }

  await createSession({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  })

  redirect('/dashboard')
}

export async function logoutAction() {
  await deleteSession()
  redirect('/login')
}
