import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createToken } from '@/lib/auth'
import { isRateLimited, incrementRateLimit, resetRateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

// Pre-computed dummy bcrypt hash to protect against timing attacks when user does not exist
const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012'

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

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimitKey = `${clientIp}_${rawUsername.toLowerCase()}`

    // Brute-force protection: check rate limit for IP and (IP + username)
    if (isRateLimited(clientIp, 10) || (rawUsername && isRateLimited(rateLimitKey, 5))) {
      const errorMsg = 'تم تجاوز عدد محاولات الدخول المسموح بها، يرجى الانتظار 15 دقيقة قبل المحاولة مجدداً.'
      if (isJson) {
        return NextResponse.json({ error: errorMsg }, { status: 429 })
      }
      return NextResponse.redirect(new URL('/login?error=rate_limited', origin), 303)
    }

    if (!rawUsername || !password) {
      const errorMsg = 'يرجى إدخال اسم المستخدم وكلمة المرور'
      if (isJson) {
        return NextResponse.json({ error: errorMsg }, { status: 400 })
      }
      return NextResponse.redirect(new URL('/login?error=missing_fields', origin), 303)
    }

    // Lookup user: exact or case-insensitive match
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
      // Run dummy compare to neutralize response-time differences (timing attack defense)
      await bcrypt.compare(password, DUMMY_HASH).catch(() => false)
      incrementRateLimit(clientIp)
      incrementRateLimit(rateLimitKey)
      const errorMsg = 'اسم المستخدم أو كلمة المرور غير صحيحة'
      if (isJson) {
        return NextResponse.json({ error: errorMsg }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login?error=invalid_credentials', origin), 303)
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      incrementRateLimit(clientIp)
      incrementRateLimit(rateLimitKey)
      const errorMsg = 'اسم المستخدم أو كلمة المرور غير صحيحة'
      if (isJson) {
        return NextResponse.json({ error: errorMsg }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login?error=invalid_credentials', origin), 303)
    }

    // Clear failed attempt counters upon successful login
    resetRateLimit(clientIp)
    resetRateLimit(rateLimitKey)

    const token = await createToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    })

    const isProd = process.env.NODE_ENV === 'production'

    if (isJson) {
      const response = NextResponse.json({
        success: true,
        redirect: '/dashboard',
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      })
      response.cookies.set('session', token, {
        httpOnly: true,
        secure: isProd,
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
        secure: isProd,
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
