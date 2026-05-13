import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const isDev = process.env.NODE_ENV === 'development';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mettre à jour les cookies de la requête pour les lectures internes
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Préparer la réponse avec les nouveaux cookies
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = isDev
              ? { ...options, secure: false }
              : options;
            response.cookies.set(name, value, cookieOptions);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/healthz');

  const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isProtectedApi = pathname.startsWith('/api/') && !isPublicPath;

  if (!user && (isProtectedPath || isProtectedApi)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};