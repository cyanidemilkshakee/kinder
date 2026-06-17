 
import type { LucideIcon } from "lucide-react"
import { Info, Shield, Heart, Zap, Lock, Mail, HelpCircle, Bug, FileText, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const supportLinks: { icon: LucideIcon; label: string; desc: string; href: string; color: string; bg: string }[] = [
    {
      icon: Mail,
      label: "Contact Us",
      desc: "Send us a message or ask a question",
      href: "/settings/contact",
      color: "text-zinc-500",
      bg: "bg-zinc-500/10",
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      desc: "FAQs and how to use the app",
      href: "/settings/help",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Bug,
      label: "Report a Bug",
      desc: "Found something broken? Let us know",
      href: "/settings/contact?type=bug",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      icon: FileText,
      label: "Privacy Policy",
      desc: "How we collect, use, and protect your data",
      href: "/settings/privacy",
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 md:p-12">
      <div className="w-full max-w-2xl text-left space-y-12">
        
        {/* Header */}
        <div className="space-y-4">
          <Info className="h-10 w-10 text-primary mb-2" />
          <h1 className="text-3xl font-extrabold tracking-tight">About Kinder</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Kinder is an unofficial, student-built platform designed specifically for the campus community to foster meaningful connections in a safe, verified environment.
          </p>
        </div>

        <div className="space-y-10">
          
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Why Kinder?</h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Meeting new people outside of your department or standard social circles can be hard. Traditional dating apps feel unsafe, saturated with fake profiles, or geographically disconnected. Kinder solves this by limiting access strictly to verified students, ensuring that the people you talk to are actual peers on campus.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-bold">Core Principles</h2>
            
            <div className="grid gap-6">
              <div className="flex gap-4 items-start">
                <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-base">Verified &amp; Safe</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Every user must verify their college email. We have zero tolerance for impersonation or harassment.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <Lock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-base">Privacy First</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your profile is completely hidden from the public internet. Only authenticated students can view profiles in the discovery pool. Hookup intent is strictly opt-in and mutually restricted.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <Zap className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-base">Meaningful Interactions</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    With limited daily super likes and mutual-consent matching, we encourage quality interactions over endless swiping.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Support & Legal */}
          <section className="space-y-4 pt-4">
            <h2 className="text-xl font-bold">Support & Legal</h2>
            <div className="grid gap-2">
              {supportLinks.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-4 py-3 hover:opacity-80 transition-opacity group"
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/50 transition-colors flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          </section>

          <section className="pt-6 space-y-2">
            <Heart className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium">
              Made with love by fellow students.
            </p>
            <p className="text-xs text-muted-foreground">
              Not affiliated with college administration.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
