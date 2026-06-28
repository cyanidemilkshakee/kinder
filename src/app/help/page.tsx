"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  HelpCircle,
  MessageCircle,
  ScrollText,
  Shield,
  User,
} from "lucide-react"
import Link from "next/link"
import { PublicInfoPage } from "@/components/PublicInfoPage"

type FAQ = {
  q: string
  a: string
}

type Section = {
  icon: LucideIcon
  title: string
  color: string
  faqs: FAQ[]
}

const sections: Section[] = [
  {
    icon: Heart,
    title: "Getting Started",
    color: "text-rose-500",
    faqs: [
      {
        q: "How do I set up my profile?",
        a: "After signup, onboarding asks for your name, username, photo, study details, intent, food/habit preferences, and interests.",
      },
      {
        q: "Who can see my profile?",
        a: "Visible profiles are shown only inside the app to logged-in users. You can hide your profile from Settings.",
      },
    ],
  },
  {
    icon: Eye,
    title: "Discover & Matching",
    color: "text-emerald-500",
    faqs: [
      {
        q: "How does swiping work?",
        a: "Like or pass on profiles in Discover. If both people like each other, it becomes a match.",
      },
      {
        q: "What happens when I get a match?",
        a: "A match unlocks chat between both users.",
      },
    ],
  },
  {
    icon: MessageCircle,
    title: "Chat",
    color: "text-zinc-500 dark:text-zinc-300",
    faqs: [
      {
        q: "Can anyone message me?",
        a: "No. Chat is available only between mutual matches.",
      },
      {
        q: "Are read receipts optional?",
        a: "Yes, read receipts can be adjusted in Settings.",
      },
    ],
  },
  {
    icon: ScrollText,
    title: "Confessions",
    color: "text-violet-500",
    faqs: [
      {
        q: "Are confessions anonymous?",
        a: "Confessions are designed to be anonymous in the public experience, with moderation for safety.",
      },
      {
        q: "Can confessions be reported?",
        a: "Yes. Reports are reviewed by the moderation team.",
      },
    ],
  },
  {
    icon: Shield,
    title: "Privacy & Safety",
    color: "text-blue-500",
    faqs: [
      {
        q: "How do I report a problem?",
        a: "Use the Contact page or Report a Bug option from About.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Go to Settings → Danger Zone after signing in.",
      },
    ],
  },
  {
    icon: User,
    title: "Account",
    color: "text-amber-500",
    faqs: [
      {
        q: "Can I sign in with email and password?",
        a: "Yes. OAuth-only users can set a password from Settings when prompted.",
      },
      {
        q: "I forgot my password. What do I do?",
        a: "Use Forgot Password on the sign-in form.",
      },
    ],
  },
]

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border/50">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors hover:text-primary"
      >
        <span className="text-sm font-semibold leading-snug">{faq.q}</span>
        {open
          ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
          : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="pb-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
        </div>
      )}
    </div>
  )
}

export default function HelpPage() {
  return (
    <PublicInfoPage
      title="Help & Support"
      description="Quick answers for using Kinder, managing your account, and staying safe."
    >
      <div className="space-y-10 rounded-[2rem] border border-border/60 bg-background/70 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
            <HelpCircle className="size-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Browse FAQs</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Can’t find what you need?{" "}
              <Link href="/contact" className="font-semibold text-primary hover:underline">
                Contact us
              </Link>
              .
            </p>
          </div>
        </div>

        {sections.map((section) => {
          const Icon = section.icon
          return (
            <section key={section.title} className="space-y-4">
              <div className="flex items-center gap-3">
                <Icon className={`size-6 ${section.color}`} />
                <h3 className="text-xl font-bold">{section.title}</h3>
              </div>
              <div className="space-y-1">
                {section.faqs.map((faq) => (
                  <FAQItem key={faq.q} faq={faq} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </PublicInfoPage>
  )
}
