import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Route → allowed roles map
const ROUTE_ROLES: Record<string, string[]> = {
  '/dashboard':        ['admin', 'cashier', 'doctor', 'nurse'],
  '/pos':              ['admin', 'cashier'],
  '/patients':         ['admin', 'cashier', 'doctor', 'nurse'],
  '/doctors':          ['admin'],
  '/inventory':        ['admin'],
  '/reports':          ['admin'],
  '/appointments':     ['admin', 'cashier', 'doctor', 'nurse'],
  '/settings/users':   ['admin'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(),
                 setAll: (c) => c.forEach(({ name, value, options }) =>
                   response.cookies.set(name, value, options)) }}
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Not logged in → redirect to login
  if (!user && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const claims = user.app_metadata
    const role: string = claims?.user_role ?? ''

    // 2. Route role check
    const matchedRoute = Object.keys(ROUTE_ROLES)
      .find(r => pathname.startsWith(r))

    if (matchedRoute && !ROUTE_ROLES[matchedRoute].includes(role)) {
      return NextResponse.redirect(new URL('/403', request.url)) // Or redirect to dashboard/login
    }
    
    // Redirect /login to dashboard if already logged in
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/public).*)']
}
