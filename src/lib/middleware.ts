 
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // IMPORTANT: keep auth.getUser() immediately after client creation so
  // middleware authorizes against Supabase's fresh server-validated user.
  const { data: { user } } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/about',
    '/contact',
    '/help',
    '/privacy',
    '/suspended',
    '/terms',
    '/auth/callback',
    '/onboarding',
    '/settings/contact',
    '/settings/help',
    '/settings/privacy',
    '/settings/terms',
  ]
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth/'))
  const routeMatches = (route: string) => pathname === route || pathname.startsWith(`${route}/`)
  const isAuthPageRoute = pathname.startsWith('/auth/') && pathname !== '/auth/callback'
  const isNormalDashboardRoute = [
    '/discover',
    '/likes',
    '/chat',
    '/confessions',
    '/profile',
    '/settings',
    '/donate',
  ].some(routeMatches)

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone()
    const [nextPathname, nextSearch = ''] = path.split('?')
    url.pathname = nextPathname
    url.search = nextSearch ? `?${nextSearch}` : ''
    return NextResponse.redirect(url)
  }

  if (!user && !isPublicRoute) {
    return redirectTo('/')
  }

  if (user && (isNormalDashboardRoute || isAuthPageRoute || pathname === '/' || pathname === '/onboarding')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('real_name, username, role, is_suspended, ban_expires_at')
      .eq('id', user.id)
      .maybeSingle()

    const isProfileIncomplete = !profile?.real_name || !profile?.username
    const isAdminAccount = profile?.role === 'admin'
    const isRestricted = Boolean(profile?.is_suspended)
      || Boolean(profile?.ban_expires_at && new Date(profile.ban_expires_at).getTime() > Date.now())

    if (isAdminAccount && (isNormalDashboardRoute || isAuthPageRoute || pathname === '/onboarding')) {
      return redirectTo('/?error=admin-account')
    }

    if (isRestricted) return redirectTo('/suspended')

    if (isAuthPageRoute) {
      if (isProfileIncomplete) return redirectTo('/onboarding')
      return redirectTo('/discover')
    }

    if (isNormalDashboardRoute) {
      if (isProfileIncomplete && pathname !== '/onboarding') return redirectTo('/onboarding')
    }
  }



  return supabaseResponse
}
