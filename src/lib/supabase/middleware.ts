import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = [
  '/dashboard',
  '/markets',
  '/watchlist',
  '/analysis',
  '/mentor',
  '/transactions',
  '/leaderboard',
  '/profile',
  '/learn',
  '/support',
  '/health',
  '/portfolio',
  '/admin',
  '/reports',
  '/mentors',
  '/recruiters',
  '/tournaments',
]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
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

  // CRITIQUE : getUser() ici rafraîchit le JWT si expiré
  // Ne pas mettre de code entre createServerClient et getUser()
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Exclure les routes publiques et de callback
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/auth/') ||        // /auth/callback etc.
    pathname.startsWith('/api/auth/') ||    // /api/auth/session (pas besoin de rediriger)
    pathname.startsWith('/api/healthz')

  const isProtectedPath = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  const isProtectedApi = pathname.startsWith('/api/') && !isPublicPath

  if (!user && (isProtectedPath || isProtectedApi)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}