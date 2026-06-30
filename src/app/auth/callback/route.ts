 
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/discover'

  if (errorParam) {
    return NextResponse.redirect(`${origin}/?error=auth`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if profile is complete
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('real_name, username, has_password, role, is_suspended, ban_expires_at, suspension_reason')
          .eq('id', user.id)
          .single()
          
        const isRestricted = Boolean(profile?.is_suspended)
          || Boolean(profile?.ban_expires_at && new Date(profile.ban_expires_at).getTime() > Date.now())

        if (profile?.role === 'admin') {
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/?error=admin-account`)
        }

        if (isRestricted) {
          await supabase.auth.signOut()
          const searchParams = new URLSearchParams()
          if (profile?.suspension_reason) {
            searchParams.set('reason', profile.suspension_reason)
          }
          const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ''
          return NextResponse.redirect(`${origin}/suspended${queryString}`)
        }

        if (!profile || !profile.real_name || !profile.username) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth`)
}
