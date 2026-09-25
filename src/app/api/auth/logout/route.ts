import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  const origin = `${proto}://${host}`

  const accept = req.headers.get('accept') || ''
  const contentType = req.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json') || (accept.includes('application/json') && !accept.includes('text/html'))

  if (isJson) {
    const response = NextResponse.json({ success: true, redirect: '/login' })
    response.cookies.delete('session')
    return response
  }

  // HTML Form submission: redirect directly to login
  const response = NextResponse.redirect(new URL('/login', origin), 303)
  response.cookies.delete('session')
  return response
}

export async function GET(req: Request) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  const origin = `${proto}://${host}`

  const response = NextResponse.redirect(new URL('/login', origin), 303)
  response.cookies.delete('session')
  return response
}
