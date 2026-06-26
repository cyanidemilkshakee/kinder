import { NextResponse } from "next/server"
import { ADMIN_PROFILE_SELECT } from "@/lib/admin-data"
import { requireAdminClient } from "@/lib/admin-server"

export async function GET() {
  const auth = await requireAdminClient()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from("confessions")
    .select(`
      id,
      sender_id,
      receiver_id,
      receiver_username,
      receiver_email,
      content,
      status,
      is_revealed,
      created_at,
      sender:profiles!sender_id(${ADMIN_PROFILE_SELECT}),
      receiver:profiles!receiver_id(${ADMIN_PROFILE_SELECT})
    `)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ confessions: data || [] })
}
