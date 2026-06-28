import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { PublicInfoPage } from "@/components/PublicInfoPage"

export default function SuspendedPage() {
  return (
    <PublicInfoPage
      title="Account Restricted"
      description="Your account is temporarily restricted from using Kinder."
    >
      <div className="rounded-[2rem] border border-border/60 bg-background/70 p-6 text-center md:p-10">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" />
        </div>
        <h2 className="text-xl font-bold">Access is currently paused</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          This can happen after safety reports or a moderation review. If you think this is a mistake,
          contact the support team and include your account email.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Contact support
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted/50"
          >
            Back to home
          </Link>
        </div>
      </div>
    </PublicInfoPage>
  )
}
