import { NextResponse } from "next/server"
import { requireAdminClient } from "@/lib/admin-server"

type Context = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireAdminClient()
  if (auth.error) return auth.error

  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  const status = body.status as string | undefined

  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "Status must be approved or rejected." }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from("confessions")
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ confession: data })
}
