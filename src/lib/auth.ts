import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'clinic-secret-key-change-in-production'
)

export interface SessionUser {
  userId: number
  username: string
  name: string
  role: string
}

export async function createToken(user: SessionUser) {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
}

const isProd = process.env.NODE_ENV === 'production'
if (isProd && !process.env.JWT_SECRET) {
  console.warn('⚠️ SECURITY WARNING: JWT_SECRET environment variable is not set in production! Using fallback.')
}

export async function createSession(user: SessionUser) {
  const token = await createToken(user)

  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return token
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function deleteSession() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('session')
  } catch {}
}

