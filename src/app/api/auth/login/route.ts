import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    let rawUsername = ''
    let password = ''

    if (isJson) {
      const body = await req.json().catch(() => ({}))
      rawUsername = body.username ? String(body.username).trim() : ''
      password = body.password ? String(body.password) : ''
    } else {
      const formData = await req.formData().catch(() => null)
      if (formData) {
        rawUsername = String(formData.get('username') || '').trim()
        password = String(formData.get('password') || '')
      }
    }

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
    const proto = req.headers.get('x-forwarded-proto') || 'http'
    const origin = `${proto}://${host}`

    if (!rawUsername || !password) {
      const errorMsg = 'يرجى إدخال اسم المستخدم وكلمة المرور'
      if (isJson) {
        return NextResponse.json({ error: errorMsg }, { status: 400 })
      }
      return NextResponse.redirect(new URL('/login?error=missing_fields', origin), 303)
    }

    // Lookup user: exact or case-insensitive
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: rawUsername },
          { username: rawUsername.toLowerCase() },
          { username: rawUsername.toUpperCase() },
        ],
      },
    })

    if (!user || !user.active) {
      const errorMsg = 'اسم المستخدم أو كلمة المرور غير صحيحة'
      if (isJson) {
        return NextResponse.json({ error: errorMsg }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login?error=invalid_credentials', origin), 303)
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      const errorMsg = 'اسم المستخدم أو كلمة المرور غير صحيحة'
      if (isJson) {
        return NextResponse.json({ error: errorMsg }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login?error=invalid_credentials', origin), 303)
    }

    const token = await createToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    })

    if (isJson) {
      const response = NextResponse.json({
        success: true,
        redirect: '/dashboard',
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
        },
      })
      response.cookies.set('session', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
      return response
    } else {
      const redirectUrl = new URL('/dashboard', origin)
      const response = NextResponse.redirect(redirectUrl, 303)
      response.cookies.set('session', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
      return response
    }
  } catch (error: any) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في النظام أثناء تسجيل الدخول' },
      { status: 500 }
    )
  }
}
