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
          .select('real_name')
          .eq('id', user.id)
          .single()
          
        if (!profile || !profile.real_name) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth`)
}
