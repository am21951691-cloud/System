import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true, redirect: '/login' })
  response.cookies.delete('session')
  return response
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const response = NextResponse.redirect(new URL('/login', url.origin))
  response.cookies.delete('session')
  return response
}
