import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { createClient } from "@/lib/server"

export default async function SuspendedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let reason = (params?.reason as string) || null
  let banExpiresAt: string | null = null
  let daysLeft = 0

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('suspension_reason, ban_expires_at')
      .eq('id', user.id)
      .single()
    reason = reason || profile?.suspension_reason || null
    banExpiresAt = profile?.ban_expires_at || null
  }

  if (banExpiresAt) {
    daysLeft = Math.ceil((new Date(banExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 bg-background">
      <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-10" />
      </div>
      <h2 className="text-3xl font-black tracking-tight text-foreground">Your account is currently suspended</h2>
      <p className="mx-auto mt-6 max-w-lg text-[16px] leading-relaxed text-muted-foreground text-center">
        Due to unforeseen circumstances, your account has been suspended{daysLeft > 0 ? ` for ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : ''}. Your profile will not be visible in discover/likes page. If you think this is a mistake, contact the support team and include your account email.
        {reason && (
          <>
            <br /><br />
            <strong className="text-foreground">Reason:</strong> {reason}
          </>
        )}
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/contact"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Contact us
        </Link>
      </div>
    </div>
  )
}
