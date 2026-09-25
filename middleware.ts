import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'clinic-secret-key-change-in-production'
)

// Public paths that do not require an active session
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore static Next.js assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session')?.value

  // If visiting /login while already having a valid session, redirect to /dashboard
  if (pathname === '/login') {
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } catch {
        // Token is invalid/expired, let user proceed to login
      }
    }
    return NextResponse.next()
  }

  // Allow public auth endpoints
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  // Protect all other routes: require valid JWT
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول (Unauthorized)' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch {
    // Invalid or manipulated token
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url))

    response.cookies.delete('session')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
