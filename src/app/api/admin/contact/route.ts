import { NextResponse } from "next/server"
import { ADMIN_PROFILE_SELECT } from "@/lib/admin-data"
import { requireAdminClient } from "@/lib/admin-server"

export async function GET() {
  const auth = await requireAdminClient()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from("support_messages")
    .select(`
      *,
      user:profiles!user_id(${ADMIN_PROFILE_SELECT})
    `)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ messages: data || [] })
}
