/* eslint-disable */
"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Heart, MessageCircle, Shield, Eye, Flame, ScrollText, Trash2, User } from "lucide-react"
import Link from "next/link"

type FAQ = {
  q: string
  a: string
}

type Section = {
  icon: LucideIcon
  title: string
  color: string
  bg: string
  faqs: FAQ[]
}

const sections: Section[] = [
  {
    icon: Heart,
    title: "Getting Started",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    faqs: [
      {
        q: "How do I set up my profile?",
        a: "Head to the Profile tab from the left sidebar. Fill in your real name, gender, department, year, and a short bio. You can also upload a photo and add up to 5 interest tags. The more complete your profile, the better your match chances.",
      },
      {
        q: "Who can see my profile?",
        a: "Only verified students on Kinder can see your profile. Your profile is shown to users who haven't matched with you yet. You can hide your profile at any time from Settings → Profile Visibility.",
      },
      {
        q: "Is my real name shown publicly?",
        a: "Yes — Kinder is a real-identity platform for college students. Authenticity helps build trust. However, only other logged-in students can see your profile.",
      },
    ],
  },
  {
    icon: Eye,
    title: "Discover & Matching",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    faqs: [
      {
        q: "How does swiping work?",
        a: "On the Discover page, you'll see profiles one at a time. Swipe or click the ✓ (like) button to like someone, or the ✗ (pass) button to skip. If they like you back, it's a match!",
      },
      {
        q: "What happens when I get a match?",
        a: "A match pop-up will appear and both of you will be able to start chatting. You can view all your matches in the Likes tab.",
      },
      {
        q: "Why am I not seeing any profiles?",
        a: "Make sure your Profile Visibility is set to visible in Settings. If you've gone through everyone in the pool, new profiles will appear as more students join. Try back later!",
      },
      {
        q: "Can I un-match someone?",
        a: "Currently, matches are permanent once made. Blocking and reporting features are coming soon.",
      },
    ],
  },
  {
    icon: MessageCircle,
    title: "Chat",
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
    faqs: [
      {
        q: "How do I start a conversation?",
        a: "You can only chat with people you've mutually matched with. Head to the Chat tab and select a match to start messaging.",
      },
      {
        q: "Are my messages private?",
        a: "Messages are stored securely in our database and are only visible to you and the other person in the conversation. We do not sell or share message data.",
      },
      {
        q: "Can I delete messages?",
        a: "Individual message deletion is not yet available. Deleting your account will remove all your data including messages after the 7-day grace period.",
      },
    ],
  },
  {
    icon: ScrollText,
    title: "Confessions",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    faqs: [
      {
        q: "What are Confessions?",
        a: "Confessions is an anonymous posting space where students can share thoughts, feelings, or light-hearted messages. All posts are anonymous — your name is never shown.",
      },
      {
        q: "Can confessions be reported?",
        a: "Yes. Each confession has a report option. We review reported confessions and remove anything that violates our community guidelines.",
      },
    ],
  },
  {
    icon: Flame,
    title: "Casual / Hookup Intent",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    faqs: [
      {
        q: "What is the Casual / Hookup Intent toggle?",
        a: "This is a strictly opt-in feature. When enabled, you'll appear in a separate pool visible only to others who have also opted in. Mutual opt-in is required before you can see each other.",
      },
      {
        q: "Can I change this setting anytime?",
        a: "You can toggle it, but only once every 24 hours. This limit is to prevent abuse and ensure intentional choices.",
      },
      {
        q: "Is this available to everyone?",
        a: "No — this feature is restricted to users who are 18 or older, as verified by their date of birth during onboarding.",
      },
    ],
  },
  {
    icon: Shield,
    title: "Privacy & Safety",
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
    faqs: [
      {
        q: "How do I hide my profile temporarily?",
        a: "Go to Settings → Profile Visibility and click 'Hide Profile'. Your profile will be removed from the discovery pool immediately. Existing matches and chats are unaffected.",
      },
      {
        q: "How do I delete my account?",
        a: "Go to Settings → Danger Zone → Delete Account. After confirming, your account enters a 7-day grace period during which it is hidden. After 7 days, all your data is permanently deleted. You can cancel during this period.",
      },
      {
        q: "I'm being harassed. What should I do?",
        a: "Please use the 'Contact Us' option in Settings to report the situation with as much detail as possible. We take safety very seriously and will act swiftly.",
      },
    ],
  },
  {
    icon: User,
    title: "Account & Profile",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    faqs: [
      {
        q: "Can I change my email or password?",
        a: "Email and password changes are handled through your college email provider. Your Kinder account is tied to your college email.",
      },
      {
        q: "Why can't I change some profile fields?",
        a: "Fields like your email are set at sign-up and linked to your verified college identity. If you believe there's an error, contact us.",
      },
      {
        q: "I forgot my password. What do I do?",
        a: "On the sign-in page, click 'Forgot Password'. We'll send a reset link to your registered college email address.",
      },
    ],
  },
]

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border border-border rounded-xl overflow-hidden transition-all duration-200 ${open ? 'shadow-sm' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="text-sm font-semibold leading-snug">{faq.q}</span>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border bg-muted/20">
          <p className="text-sm text-muted-foreground leading-relaxed pt-3">{faq.a}</p>
        </div>
      )}
    </div>
  )
}

export default function HelpPage() {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="flex-1 p-6">
        <div className="w-full max-w-2xl mx-auto space-y-5">

          {/* Header card */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="bg-muted/30 p-6 border-b border-border flex items-center gap-3">
              <Link
                href="/settings"
                className="h-9 w-9 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Help & Support</h2>
                  <p className="text-sm text-muted-foreground">Everything you need to know about Kinder.</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Browse the sections below to find answers. Can't find what you're looking for?{" "}
                <Link href="/settings/contact" className="text-primary font-semibold hover:underline">
                  Contact us
                </Link>{" "}
                and we'll help you out.
              </p>
            </div>
          </div>

          {/* FAQ Sections */}
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <div key={section.title} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 pt-5 pb-3">
                  <div className={`h-8 w-8 rounded-lg ${section.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${section.color}`} />
                  </div>
                  <h3 className="font-bold text-sm">{section.title}</h3>
                </div>
                <div className="px-6 pb-6 space-y-2">
                  {section.faqs.map((faq, i) => (
                    <FAQItem key={i} faq={faq} />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Still need help */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-sm">Still need help?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Our team is happy to assist you with anything not covered here.</p>
            </div>
            <Link
              href="/settings/contact"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 flex-shrink-0"
            >
              Contact Us
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
