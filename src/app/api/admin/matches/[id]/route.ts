import { NextResponse } from "next/server"
import { requireAdminClient } from "@/lib/admin-server"

type Context = {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, context: Context) {
  const auth = await requireAdminClient()
  if (auth.error) return auth.error

  const { id } = await context.params
  const { error } = await auth.supabase
    .from("matches")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
