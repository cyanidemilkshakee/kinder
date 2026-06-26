import { NextResponse } from "next/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/server"

export async function requireAdminClient() {
  const sessionClient = await createClient()
  const { data: { user }, error: userError } = await sessionClient.auth.getUser()

  if (userError || !user) {
    return {
      error: NextResponse.json({ error: "Not authenticated." }, { status: 401 }),
    }
  }

  const { data: profile, error: profileError } = await sessionClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Admin access required." }, { status: 403 }),
    }
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    return {
      error: NextResponse.json(
        {
          error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server, so admin-wide data/actions are unavailable.",
        },
        { status: 503 },
      ),
    }
  }

  const supabase = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )

  return { supabase, user }
}
