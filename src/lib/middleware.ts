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

  // IMPORTANT: Do not put code between createServerClient and getClaims()
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/callback', '/onboarding']
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth/'))

  if (!user && !isPublicRoute) {
    // Redirect unauthenticated users to the root login page
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // If authenticated user visits root (/), redirect to /discover
  if (user && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/discover'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
