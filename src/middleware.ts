import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/staff-login', '/forgot-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Root → Landing Page (no redirect)
  if (pathname === '/') {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const cookies = request.cookies.getAll()
  const hasAdminAuth = cookies.some(c =>
    c.name.includes('auth-token') ||
    c.name.includes('access-token') ||
    c.name.startsWith('sb-')
  )

  const staffCookie = request.cookies.get('staff_session')
  const hasStaffAuth = staffCookie !== undefined && staffCookie.value.length > 0

  if (!hasAdminAuth && !hasStaffAuth) {
    return NextResponse.redirect(new URL('/staff-login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ]
}
