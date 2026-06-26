import Link from "next/link"
import { ArrowLeft, Heart } from "lucide-react"
import type { ReactNode } from "react"

type PublicInfoPageProps = {
  eyebrow?: string
  title: string
  description?: string
  children: ReactNode
}

export function PublicInfoPage({ eyebrow = "Kinder", title, description, children }: PublicInfoPageProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-primary">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/12">
              <Heart className="size-4 fill-primary" />
            </span>
            Kinder
          </Link>
          <nav className="flex items-center gap-4 text-xs font-bold text-muted-foreground sm:text-sm">
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/help" className="hover:text-foreground">Help</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to landing
        </Link>

        <section className="rounded-[2rem] border border-border/60 bg-background/75 p-6 shadow-sm backdrop-blur md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
          {description && (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {description}
            </p>
          )}
        </section>

        <div className="py-8 md:py-10">
          {children}
        </div>
      </div>
    </main>
  )
}
