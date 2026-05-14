import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route → allowed roles map
const ROUTE_ROLES: Record<string, string[]> = {
  '/dashboard':      ['admin', 'cashier', 'doctor', 'nurse'],
  '/pos':            ['admin', 'cashier'],
  '/patients':       ['admin', 'cashier', 'doctor', 'nurse'],
  '/doctors':        ['admin'],
  '/inventory':      ['admin'],
  '/reports':        ['admin'],
  '/appointments':   ['admin', 'cashier', 'doctor', 'nurse'],
  '/settings/users': ['admin'],
}

// In Next.js 16, middleware is renamed to "proxy" (same functionality)
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do NOT add logic between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Not logged in → redirect to login (allow /login and API routes)
  if (!user && pathname !== '/login' && !pathname.startsWith('/api/') && pathname !== '/403') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const role: string = user.app_metadata?.user_role ?? ''

    // 2. Role-based route check
    const matchedRoute = Object.keys(ROUTE_ROLES)
      .find(r => pathname.startsWith(r))

    if (matchedRoute && !ROUTE_ROLES[matchedRoute].includes(role)) {
      return NextResponse.redirect(new URL('/403', request.url))
    }

    // 3. Already logged in → redirect away from login page
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
