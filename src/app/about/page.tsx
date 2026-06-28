"use client"

import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  Bug,
  ChevronRight,
  FileCheck2,
  FileText,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  Lock,
  Mail,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { LandingFooter, LandingThemeToggle, LandingTopBar } from "@/components/landing/LandingChrome"
import { createClient } from "@/lib/client"

// ... (keep the rest unchanged until the component function)
// We need to keep the arrays but replace the export default async function AboutPage()

type IconCard = {
  icon: LucideIcon
  title: string
  body: string
  gradient: string
}

const principles: IconCard[] = [
  {
    icon: ShieldCheck,
    title: "Verified & Safe",
    body: "Kinder is built around real campus identities and active moderation, so students can meet with more trust.",
    gradient: "bg-gradient-to-br from-emerald-400 to-teal-500",
  },
  {
    icon: Lock,
    title: "Privacy First",
    body: "Profiles are not public internet pages. Discovery, likes, chats, and confessions stay inside the authenticated app experience.",
    gradient: "bg-gradient-to-br from-zinc-500 to-zinc-700",
  },
  {
    icon: MessageCircleHeart,
    title: "Meaningful Interactions",
    body: "Friendship, dating, mutual matches, and limited super likes are designed to make connection feel intentional.",
    gradient: "bg-gradient-to-br from-rose-400 to-pink-500",
  },
]

const supportLinks: { icon: LucideIcon; label: string; desc: string; href: string; gradient: string }[] = [
  {
    icon: Mail,
    label: "Contact Us",
    desc: "Send us a message or ask a question",
    href: "/contact",
    gradient: "bg-gradient-to-br from-zinc-400 to-zinc-600",
  },
  {
    icon: HelpCircle,
    label: "Help & Support",
    desc: "FAQs and how to use the app",
    href: "/help",
    gradient: "bg-gradient-to-br from-emerald-400 to-teal-500",
  },
  {
    icon: Bug,
    label: "Report a Bug",
    desc: "Found something broken? Let us know",
    href: "/contact?type=bug",
    gradient: "bg-gradient-to-br from-orange-400 to-amber-500",
  },
  {
    icon: FileText,
    label: "Privacy Policy",
    desc: "How we collect, use, and protect your data",
    href: "/privacy",
    gradient: "bg-gradient-to-br from-violet-400 to-purple-500",
  },
  {
    icon: FileCheck2,
    label: "Terms & Conditions",
    desc: "The rules and responsibilities for using Kinder",
    href: "/terms",
    gradient: "bg-gradient-to-br from-amber-300 to-yellow-500",
  },
]

const particles = [
  { size: 4, top: "12%", left: "8%", color: "#FFD700", duration: 10, delay: 0 },
  { size: 6, top: "24%", left: "88%", color: "#DFA7A8", duration: 13, delay: 1 },
  { size: 3, top: "48%", left: "16%", color: "#C8A2C8", duration: 12, delay: 2 },
  { size: 5, top: "70%", left: "78%", color: "#FFD700", duration: 15, delay: 1.5 },
  { size: 4, top: "82%", left: "32%", color: "#DFA7A8", duration: 11, delay: 0.5 },
  { size: 7, top: "38%", left: "58%", color: "#C8A2C8", duration: 16, delay: 2.5 },
  { size: 3, top: "18%", left: "46%", color: "#FFD700", duration: 14, delay: 3 },
  { size: 5, top: "62%", left: "6%", color: "#DFA7A8", duration: 13, delay: 1 },
]

function AboutCard({ icon: Icon, title, body, gradient }: IconCard) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/60 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10">
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${gradient} shadow-lg`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,215,0,0.05) 0%, transparent 70%)" }}
      />
    </div>
  )
}

export default function AboutPage() {
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setIsSignedIn(true)
    }
    checkAuth()
  }, [])

  return (
    <>
      <style>{`
        @keyframes float {
          from { transform: translateY(0px) rotate(0deg); }
          to   { transform: translateY(-30px) rotate(180deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.05); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.7s ease-out forwards;
          opacity: 0;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 4s ease infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .hero-glow {
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,215,0,0.18) 0%, transparent 70%);
        }
        .dark .hero-glow {
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,215,0,0.12) 0%, transparent 70%);
        }
        .text-gradient {
          background: linear-gradient(135deg, #FFD700 0%, #DFA7A8 50%, #C8A2C8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .dark .text-gradient {
          background: linear-gradient(135deg, #FFD700 0%, #C8A2C8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .card-glass {
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .dark .card-glass {
          background: rgba(20,20,20,0.6);
        }
      `}</style>

      <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
        <LandingTopBar isSignedIn={isSignedIn} />

        <section className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-8 lg:px-16">
          <div className="hero-glow pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute -top-60 -left-60 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl animate-pulse-slow" />
          <div className="pointer-events-none absolute -right-60 top-20 h-[500px] w-[500px] rounded-full bg-secondary/20 blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
          <div className="pointer-events-none absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-accent/10 blur-2xl" />

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {particles.map((particle, index) => (
              <div
                key={index}
                className="absolute rounded-full opacity-20 dark:opacity-10"
                style={{
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  top: particle.top,
                  left: particle.left,
                  background: particle.color,
                  animation: `float ${particle.duration}s ease-in-out ${particle.delay}s infinite alternate`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                About Kinder
              </div>

              <h1 className="animate-fade-in-up text-5xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl" style={{ animationDelay: "100ms" }}>
                A safer way to meet people on{" "}
                <span className="text-gradient animate-gradient">your campus</span>
              </h1>

              <p className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg" style={{ animationDelay: "200ms" }}>
                Kinder is an unofficial, student-built platform for campus communities to foster meaningful connections in a more verified, intentional environment.
              </p>

              <div className="animate-fade-in-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row" style={{ animationDelay: "300ms" }}>
                {isSignedIn ? (
                  <Link
                    href="/discover"
                    className="group flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-xl transition-all hover:scale-105 hover:shadow-primary/40"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <Link
                    href="/auth/signup"
                    className="group flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-xl transition-all hover:scale-105 hover:shadow-primary/40"
                  >
                    Join Kinder
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
                <Link
                  href="/#features"
                  className="flex items-center gap-2 rounded-2xl border border-border/60 px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/5"
                >
                  See Features
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="card-glass rounded-3xl border border-border/50 p-8 shadow-2xl shadow-primary/5">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Why Kinder?</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Meeting new people outside your department or standard social circles can be surprisingly hard. Traditional dating apps often feel unsafe, disconnected from campus life, or crowded with fake profiles. Kinder narrows the world to verified students so the people you meet feel relevant, nearby, and real.
              </p>
            </div>

            <div className="rounded-3xl border border-primary/30 bg-primary/10 p-8">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
                <GraduationCap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">For students</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Built independently by students, for students. Not affiliated with college administration.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                <Zap className="h-3.5 w-3.5" />
                Core Principles
              </div>
              <h2 className="text-4xl font-black tracking-tight text-foreground">Built to feel intentional</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {principles.map((item) => (
                <AboutCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                <HeartHandshake className="h-3.5 w-3.5" />
                Support & Legal
              </div>
              <h2 className="text-4xl font-black tracking-tight text-foreground">Everything important, one step away</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {supportLinks.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-background/60 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.gradient} shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-secondary/10 p-8 text-center shadow-2xl shadow-primary/10 sm:p-12">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Made with care by fellow students.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Kinder is independent and student-built. The goal is simple: make campus discovery feel warmer, safer, and more human.
            </p>
          </div>
        </section>

        <LandingFooter />
        <LandingThemeToggle />
      </div>
    </>
  )
}
