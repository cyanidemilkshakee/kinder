import { NextResponse } from "next/server"
import { ADMIN_PROFILE_SELECT } from "@/lib/admin-data"
import { requireAdminClient } from "@/lib/admin-server"

type Context = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireAdminClient()
  if (auth.error) return auth.error

  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  const action = body.action as string | undefined
  const days = Number(body.days || 7)
  const updates: Record<string, unknown> = {}

  if (action === "suspend") {
    updates.is_suspended = true
    updates.ban_expires_at = null
  } else if (action === "unsuspend") {
    updates.is_suspended = false
    updates.ban_expires_at = null
  } else if (action === "ban") {
    const expires = new Date()
    expires.setDate(expires.getDate() + (Number.isFinite(days) && days > 0 ? days : 7))
    updates.is_suspended = false
    updates.ban_expires_at = expires.toISOString()
  } else if (action === "visible") {
    updates.is_visible = true
  } else if (action === "hidden") {
    updates.is_visible = false
  } else {
    return NextResponse.json({ error: "Unsupported profile action." }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select(ADMIN_PROFILE_SELECT)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
