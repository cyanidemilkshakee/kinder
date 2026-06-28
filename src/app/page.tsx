/* eslint-disable */
"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  Heart,
  MessageCircle,
  ScrollText,
  Users,
  Shield,
  Sparkles,
  ChevronRight,
  Star,
  Zap,
  Lock,
  GraduationCap,
  ArrowRight,
  Check,
} from "lucide-react"
import { createClient } from "@/lib/client"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { LandingFooter, LandingThemeToggle, LandingTopBar } from "@/components/landing/LandingChrome"

// ─── Floating Particles ────────────────────────────────────────────
function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20 dark:opacity-10"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            background: i % 3 === 0 ? "#FFD700" : i % 3 === 1 ? "#DFA7A8" : "#C8A2C8",
            animation: `float ${Math.random() * 10 + 8}s ease-in-out ${Math.random() * 5}s infinite alternate`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Feature Card ──────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  description,
  gradient,
  delay = 0,
}: {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
  delay?: number
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/60 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${gradient}`}>
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,215,0,0.05) 0%, transparent 70%)" }} />
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────
function StatCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border/40 bg-background/50 p-6 text-center backdrop-blur-sm">
      <div className="mb-2 text-primary">{icon}</div>
      <div className="text-3xl font-extrabold text-foreground">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  )
}

// ─── Screenshot Mockup ─────────────────────────────────────────────
function PhoneMockup({ children, tilt = 0 }: { children: React.ReactNode; tilt?: number }) {
  return (
    <div
      className="relative mx-auto w-[280px] overflow-hidden rounded-[2.5rem] border-4 border-border/60 bg-background shadow-2xl transition-transform duration-700 hover:scale-105"
      style={{ transform: `rotate(${tilt}deg)`, boxShadow: "0 40px 80px rgba(0,0,0,0.4)" }}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-b-xl bg-background/90 border-b border-border/40" />
      <div className="h-[560px] overflow-hidden">{children}</div>
    </div>
  )
}

// ─── Testimonial Card ──────────────────────────────────────────────
function TestimonialCard({
  quote,
  name,
  dept,
  emoji,
}: {
  quote: string
  name: string
  dept: string
  emoji: string
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/30">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
        ))}
      </div>
      <p className="text-sm italic leading-relaxed text-muted-foreground">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-lg">{emoji}</div>
        <div>
          <div className="text-sm font-semibold text-foreground">{name}</div>
          <div className="text-xs text-muted-foreground">{dept}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Landing Page ─────────────────────────────────────────────
export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()

  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('real_name, username, role')
            .eq('id', user.id)
            .maybeSingle()

          if (profile?.role === 'admin') {
            await supabase.auth.signOut()
            setIsSignedIn(false)
            setCheckingSession(false)
            return
          }

          if (!profile?.real_name || !profile?.username) {
            router.replace('/onboarding')
            return
          } else {
            setIsSignedIn(true)
          }
        }
      } catch (_) {}
      setCheckingSession(false)
    }
    checkSession()
  }, [])

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

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
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
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
        .animate-ticker {
          animation: ticker 30s linear infinite;
          white-space: nowrap;
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
        .section-divider {
          background: linear-gradient(90deg, transparent 0%, var(--border) 50%, transparent 100%);
          height: 1px;
          opacity: 0.5;
        }
      `}</style>

      <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">

        {/* ── NAVBAR ─────────────────────────────────────────────── */}
        <LandingTopBar isSignedIn={isSignedIn} />

        {/* ── HERO SECTION ───────────────────────────────────────── */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
          {/* Background glow */}
          <div className="hero-glow pointer-events-none absolute inset-0" />

          {/* Animated blobs */}
          <div className="pointer-events-none absolute -top-60 -left-60 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl animate-pulse-slow" />
          <div className="pointer-events-none absolute -bottom-60 -right-60 h-[600px] w-[600px] rounded-full bg-secondary/15 blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
          <div className="pointer-events-none absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-accent/10 blur-2xl" />

          <FloatingParticles />

          <div className="relative z-10 w-full px-4 py-20 text-center sm:px-8 lg:px-16">
            {/* Badge */}
            <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Campus-Exclusive Social Discovery
            </div>

            {/* Headline */}
            <h1 className="animate-fade-in-up mx-auto mb-6 max-w-4xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-8xl" style={{ animationDelay: "100ms" }}>
              Find Your{" "}
              <span className="text-gradient animate-gradient">People</span>
              {" "}on Campus
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-in-up mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl" style={{ animationDelay: "200ms" }}>
              Kinder is a secure, student-only platform for discovering friends, sparks, and meaningful connections — all within your college community.
            </p>

            {/* CTA buttons */}
            <div className="animate-fade-in-up flex flex-col items-center justify-center gap-4 sm:flex-row" style={{ animationDelay: "300ms" }}>
              {isSignedIn ? (
                <Link
                  href="/discover"
                  className="group flex items-center gap-2 rounded-2xl bg-[#FFD700] px-8 py-4 text-base font-bold text-black shadow-xl shadow-[#FFD700]/20 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#FFD700]/30"
                >
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/signup"
                    className="group flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/30"
                  >
                    Get Started — It's Free
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-2 rounded-2xl border border-border/60 px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/5"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Trust indicators */}
            <p className="animate-fade-in-up mt-6 text-xs text-muted-foreground" style={{ animationDelay: "400ms" }}>
              ✓ College email verified &nbsp;·&nbsp; ✓ No spam, ever &nbsp;·&nbsp; ✓ Free to join
            </p>

            {/* Scroll indicator */}
            <div className="animate-fade-in-up mt-16 flex justify-center" style={{ animationDelay: "600ms" }}>
              <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                <span>Explore Features</span>
                <div className="flex h-8 w-5 items-center justify-center rounded-full border border-border/50">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TICKER ─────────────────────────────────────────────── */}
        <div className="border-y border-border/30 bg-muted/30 py-3 overflow-hidden">
          <div className="animate-ticker inline-flex gap-12 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {[
              "✦ Meet Classmates", "✦ Anonymous Confessions", "✦ Real-Time Chat",
              "✦ Smart Matching", "✦ Verified Students", "✦ Privacy First",
              "✦ Meet Classmates", "✦ Anonymous Confessions", "✦ Real-Time Chat",
              "✦ Smart Matching", "✦ Verified Students", "✦ Privacy First",
            ].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── STATS ──────────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-8 lg:px-16">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard value="10K+" label="Students Joined" icon={<Users className="h-5 w-5" />} />
            <StatCard value="50K+" label="Matches Made" icon={<Heart className="h-5 w-5" />} />
            <StatCard value="200K+" label="Messages Sent" icon={<MessageCircle className="h-5 w-5" />} />
            <StatCard value="99%" label="Satisfaction Rate" icon={<Star className="h-5 w-5" />} />
          </div>
        </section>

        <div className="section-divider mx-4 sm:mx-8 lg:mx-16" />

        {/* ── FEATURES ───────────────────────────────────────────── */}
        <section id="features" className="py-24 px-4 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-7xl">
          {/* Section header */}
          <div className="mb-16 text-center">

            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Everything you need to{" "}
              <span className="text-gradient">connect</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Built specifically for college life — every feature is designed around your campus experience.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Users className="h-6 w-6 text-white" />}
              title="Rich Profiles"
              description="Showcase your personality with photos, bio, study field, graduation year, relationship intent, food habits, and interest tags. Let people know who you really are."
              gradient="bg-gradient-to-br from-yellow-400 to-amber-500"
              delay={0}
            />
            <FeatureCard
              icon={<Heart className="h-6 w-6 text-white" />}
              title="Smart Discovery"
              description="Our algorithm matches you based on your goals — whether friendship or romance. Swipe through curated profiles and never see someone you've already decided on."
              gradient="bg-gradient-to-br from-rose-400 to-pink-500"
              delay={100}
            />
            <FeatureCard
              icon={<ScrollText className="h-6 w-6 text-white" />}
              title="Anonymous Confessions"
              description="Slide into someone's inbox without revealing yourself. Messages go through a moderation queue and need the recipient's explicit consent before being revealed."
              gradient="bg-gradient-to-br from-violet-500 to-purple-600"
              delay={200}
            />
            <FeatureCard
              icon={<MessageCircle className="h-6 w-6 text-white" />}
              title="Real-Time Chat"
              description="Once you match, start chatting instantly with Supabase-powered real-time messaging. Every conversation begins with an AI-generated icebreaker prompt."
              gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
              delay={300}
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6 text-white" />}
              title="Safety Moderation"
              description="Confessions, reports, and community guideline issues are reviewed through protected moderation workflows before they affect students."
              gradient="bg-gradient-to-br from-blue-400 to-indigo-500"
              delay={400}
            />
            <FeatureCard
              icon={<GraduationCap className="h-6 w-6 text-white" />}
              title="Campus-Only Access"
              description="Only students with verified college email addresses can join. No random strangers — just your campus community in a safe, exclusive space."
              gradient="bg-gradient-to-br from-orange-400 to-red-500"
              delay={500}
            />
          </div>
          </div>
        </section>

        <div className="section-divider mx-4 sm:mx-8 lg:mx-16" />

        {/* ── HOW IT WORKS ───────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 px-4 sm:px-8 lg:px-16">
          <div className="mb-16 text-center">

            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Up and running in{" "}
              <span className="text-gradient">3 steps</span>
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create your Profile",
                desc: "Sign up with your college email, pick a username, and build your profile with photos, interests, and what you're looking for.",
                icon: <GraduationCap className="h-7 w-7 text-primary" />,
              },
              {
                step: "02",
                title: "Discover & Match",
                desc: "Browse curated profiles filtered by your intent. Swipe right to connect, left to skip. Get notified when it's mutual.",
                icon: <Heart className="h-7 w-7 text-primary" />,
              },
              {
                step: "03",
                title: "Chat & Connect",
                desc: "Start real-time conversations with your matches. Break the ice with AI-generated conversation starters.",
                icon: <MessageCircle className="h-7 w-7 text-primary" />,
              },
            ].map((item, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                {/* Connector line */}
                {i < 2 && (
                  <div className="absolute top-10 left-[calc(50%+3rem)] hidden h-0.5 w-[calc(100%-6rem)] bg-gradient-to-r from-primary/40 to-transparent md:block" />
                )}
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-primary/30 bg-primary/10 shadow-lg shadow-primary/10">
                  {item.icon}
                </div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">{item.step}</div>
                <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="section-divider mx-4 sm:mx-8 lg:mx-16" />

        {/* ── APP SCREENSHOTS ─────────────────────────────────────── */}
        <section className="py-24 px-4 overflow-hidden sm:px-8 lg:px-16">
          <div className="mb-16 text-center">

            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Beautiful on every{" "}
              <span className="text-gradient">screen</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              A premium, polished experience designed with care — dark and light modes included.
            </p>
          </div>

          {/* Phone mockups row */}
          <div className="flex flex-wrap items-end justify-center gap-8 lg:gap-16">
              <PhoneMockup tilt={-6}>
                <div className="h-full w-full bg-black p-4">
                  <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-yellow-400">Discover</div>
                  {/* Simulated profile card */}
                  <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-900">
                    <div className="absolute inset-0 flex items-center justify-center text-6xl">👩‍🎓</div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                      <div className="text-lg font-bold text-white">Priya S., 20</div>
                      <div className="text-xs text-zinc-300">Computer Science • 2026</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {["Coffee", "Photography", "Coding"].map(t => (
                          <span key={t} className="rounded-full bg-yellow-400/20 border border-yellow-400/30 px-2 py-0.5 text-[10px] text-yellow-300">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center gap-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-400/40 bg-red-400/10 text-red-400 text-xl">✕</div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-yellow-400/60 bg-yellow-400/20 text-yellow-400 text-2xl shadow-lg shadow-yellow-400/20">⭐</div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-400/40 bg-green-400/10 text-green-400 text-xl">♥</div>
                  </div>
                </div>
              </PhoneMockup>

              <PhoneMockup tilt={0}>
                <div className="h-full w-full bg-black p-4">
                  <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-yellow-400">Messages</div>
                  <div className="mb-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20 p-2 text-center text-[10px] text-yellow-300 italic">
                    💬 "What's your go-to late-night study snack?"
                  </div>
                  <div className="space-y-2">
                    {[
                      { msg: "Hey! Loved your photography portfolio 📸", mine: false },
                      { msg: "Haha thanks! I go everywhere with my camera 😄", mine: true },
                      { msg: "We should shoot on campus sometime!", mine: false },
                      { msg: "Absolutely! Saturday morning?", mine: true },
                      { msg: "Perfect, let's do it! 🎉", mine: false },
                    ].map((m, i) => (
                      <div key={i} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3 py-1.5 text-[11px] leading-snug ${
                          m.mine ? "bg-yellow-400 text-black" : "bg-zinc-800 text-zinc-100"
                        }`}>
                          {m.msg}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-6 left-4 right-4 flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-2">
                    <div className="flex-1 text-[11px] text-zinc-500">Type a message…</div>
                    <div className="h-6 w-6 flex items-center justify-center rounded-full bg-yellow-400 text-black text-[10px]">↑</div>
                  </div>
                </div>
              </PhoneMockup>

              <PhoneMockup tilt={6}>
                <div className="h-full w-full bg-black p-4">
                  <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-yellow-400">Confessions</div>
                  <div className="space-y-3">
                    {[
                      { text: "I've had a crush on you since orientation week... 🌸", time: "2h ago" },
                      { text: "Your smile in the library makes my whole day better ☀️", time: "5h ago" },
                      { text: "We've been in the same seminar for a semester and I never said hi... hi! 👋", time: "1d ago" },
                    ].map((c, i) => (
                      <div key={i} className="rounded-xl border border-zinc-700/50 bg-zinc-900 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px]">👤</div>
                          <div className="text-[10px] text-zinc-500">Anonymous · {c.time}</div>
                        </div>
                        <p className="text-xs text-zinc-200 leading-relaxed mb-2">{c.text}</p>
                        <button className="w-full rounded-lg bg-yellow-400/20 border border-yellow-400/30 py-1 text-[10px] font-bold text-yellow-300 hover:bg-yellow-400/30 transition-colors">
                          Accept &amp; Read
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>
          </div>
        </section>

        <div className="section-divider mx-4 sm:mx-8 lg:mx-16" />

        {/* ── SAFETY SECTION ─────────────────────────────────────── */}
        <section id="safety" className="py-24 px-4 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl border border-border/40 bg-gradient-to-br from-muted/30 to-background p-8 md:p-12 lg:p-16">
              <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                <div>

                  <h2 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
                    Your safety is our{" "}
                    <span className="text-gradient">priority</span>
                  </h2>
                  <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                    Kinder is built from the ground up with security and privacy at its core. We use Supabase's Row Level Security to ensure you only ever see what you're supposed to.
                  </p>
                  <div className="space-y-4">
                    {[
                      { icon: <Lock className="h-4 w-4" />, text: "Row Level Security on all database tables" },
                      { icon: <Shield className="h-4 w-4" />, text: "Moderation for all anonymous content" },
                      { icon: <Check className="h-4 w-4" />, text: "College email verification for every account" },
                      { icon: <Zap className="h-4 w-4" />, text: "Automated bans for policy violations" },
                      { icon: <Users className="h-4 w-4" />, text: "Consent-gated confession reveals" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          {item.icon}
                        </div>
                        <span className="text-sm text-foreground">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur-sm">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-1 text-base font-bold">End-to-End Privacy</h3>
                    <p className="text-sm text-muted-foreground">Your personal data never leaves the Supabase infrastructure. RLS policies ensure zero cross-user data leakage.</p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur-sm">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                      <ScrollText className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-1 text-base font-bold">Moderated Confessions</h3>
                    <p className="text-sm text-muted-foreground">Every anonymous message is reviewed before reaching you. Harmful content is blocked and senders are actioned automatically.</p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur-sm">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-1 text-base font-bold">Report & Block</h3>
                    <p className="text-sm text-muted-foreground">One-tap reporting for any profile or message. The moderation team reviews reports with transparent outcomes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider mx-4 sm:mx-8 lg:mx-16" />

        {/* ── TESTIMONIALS ────────────────────────────────────────── */}
        <section id="testimonials" className="py-24 px-4 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">

              <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                Loved by students{" "}
                <span className="text-gradient">everywhere</span>
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <TestimonialCard
                quote="I was nervous about meeting people in my first year. Kinder helped me find my study group AND my best friend in one week!"
                name="Ananya K."
                dept="Engineering, Year 1"
                emoji="🌸"
              />
              <TestimonialCard
                quote="The anonymous confession feature is so clever. I sent one to my lab partner and it turned into something really special."
                name="Rohan M."
                dept="Biology, Year 3"
                emoji="💛"
              />
              <TestimonialCard
                quote="Finally a social app that feels safe and isn't full of creeps. The moderation actually works and that's rare."
                name="Sneha P."
                dept="Arts & Design, Year 2"
                emoji="🎨"
              />
              <TestimonialCard
                quote="The icebreaker prompts in chat are genius. It kills the awkward first message problem completely."
                name="Arjun V."
                dept="Commerce, Year 4"
                emoji="☕"
              />
              <TestimonialCard
                quote="I love that I can set my intent to 'Friendship Only' and it actually respects that. Matches feel relevant."
                name="Meera S."
                dept="Literature, Year 2"
                emoji="📚"
              />
              <TestimonialCard
                quote="The dark mode looks incredibly slick. But more importantly it helped me find my circle within a month of joining college."
                name="Dev R."
                dept="Computer Science, Year 3"
                emoji="💻"
              />
            </div>
          </div>
        </section>

        <div className="section-divider mx-4 sm:mx-8 lg:mx-16" />

        {/* ── TECH STACK ──────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-8 lg:px-16">
          <div className="w-full text-center">
            <p className="mb-8 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Built with industry-grade technology</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                { name: "Next.js 15", emoji: "▲" },
                { name: "React 19", emoji: "⚛" },
                { name: "Supabase", emoji: "⚡" },
                { name: "Tailwind CSS", emoji: "🎨" },
                { name: "TypeScript", emoji: "🔷" },
                { name: "Radix UI", emoji: "🟣" },
              ].map((tech) => (
                <div key={tech.name} className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/60 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/5">
                  <span>{tech.emoji}</span>
                  <span>{tech.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ───────────────────────────────────────────── */}
        <section className="py-24 px-4 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 p-10 text-center md:p-16">
              {/* Background decoration */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
              <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-secondary/15 blur-3xl" />

              <div className="relative z-10">
                <div className="mb-4 text-4xl">✨</div>
                <h2 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
                  Ready to find your{" "}
                  <span className="text-gradient">people?</span>
                </h2>
                <p className="mb-8 mx-auto max-w-lg text-lg text-muted-foreground">
                  Join thousands of students already connecting on campus. It's free, secure, and takes less than 2 minutes.
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  {isSignedIn ? (
                    <Link
                      href="/discover"
                      className="group flex items-center gap-2 rounded-2xl bg-[#FFD700] px-8 py-4 text-base font-bold text-black shadow-xl shadow-[#FFD700]/20 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#FFD700]/30"
                    >
                      Go to Dashboard
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/auth/signup"
                        className="group flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/30"
                      >
                        Join Kinder Now
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Link>
                      <Link
                        href="/auth/login"
                        className="flex items-center gap-2 rounded-2xl border border-border/60 px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/5"
                      >
                        Already have an account?
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <LandingFooter />

        {/* ── THEME TOGGLE (bottom-right) ─────────────────────────── */}
        <LandingThemeToggle />
      </div>
    </>
  )
}
