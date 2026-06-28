import Link from "next/link"
import {
  ArrowRight,
  Bug,
  FileCheck2,
  FileText,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  Lock,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

const principles = [
  {
    icon: ShieldCheck,
    title: "Verified campus community",
    body: "Kinder is designed around real student identity, active account restrictions, and campus-first discovery.",
  },
  {
    icon: Lock,
    title: "Private by default",
    body: "Profiles, likes, chats, and confessions stay within the signed-in app experience instead of becoming public web pages.",
  },
  {
    icon: MessageCircleHeart,
    title: "Intentional connection",
    body: "Mutual matching, limited super likes, and report controls keep interactions more deliberate and easier to moderate.",
  },
]

const resources = [
  { icon: HelpCircle, label: "Help", href: "/settings/help" },
  { icon: Bug, label: "Report a bug", href: "/settings/contact?type=bug" },
  { icon: FileText, label: "Privacy", href: "/settings/privacy" },
  { icon: FileCheck2, label: "Terms", href: "/settings/terms" },
]

export default function SignedInAboutPage() {
  return (
    <div className="h-full overflow-y-auto p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-5 border-b border-border/60 pb-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold uppercase text-primary">
            <Sparkles className="size-3.5" />
            About Kinder
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                A safer campus space for meeting people.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Kinder is an independent student-built app for friendship, dating, confessions, and campus discovery. It is built to feel smaller, more relevant, and more accountable than open social platforms.
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/70 p-5 shadow-sm backdrop-blur">
              <GraduationCap className="mb-4 size-7 text-primary" />
              <p className="text-sm font-semibold">Made for students</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Built by students with a simple goal: help people meet with more context, care, and trust.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {principles.map((item) => {
            const Icon = item.icon
            return (
              <article key={item.title} className="rounded-xl border border-border/60 bg-background/70 p-5 shadow-sm backdrop-blur">
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Icon className="size-5" />
                </div>
                <h2 className="text-sm font-bold">{item.title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            )
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-xl border border-border/60 bg-background/70 p-6 shadow-sm backdrop-blur">
            <HeartHandshake className="mb-4 size-7 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">How we keep it useful</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The product favors a smaller set of meaningful actions over noisy feeds. Discovery is filtered by preferences, chat opens after a match, and safety reports are kept close to every profile.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/70 p-6 shadow-sm backdrop-blur">
            <h2 className="text-xl font-bold tracking-tight">Quick resources</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {resources.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group flex items-center justify-between rounded-lg border border-border/50 bg-muted/25 px-4 py-3 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-primary/10"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="size-4 text-primary" />
                      {item.label}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
