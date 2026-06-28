import type { ReactNode } from "react"
import Link from "next/link"
import { FileText } from "lucide-react"
import { PublicInfoPage } from "@/components/PublicInfoPage"

type PolicySection = {
  title: string
  content: ReactNode
}

const LAST_UPDATED = "June 15, 2025"

const policySections: PolicySection[] = [
  {
    title: "1. Who We Are",
    content: (
      <p>
        Kinder is a campus-exclusive social platform operated for college students. We are not affiliated with college administration.
        This Privacy Policy explains how we collect, use, and protect your personal information when you use Kinder.
      </p>
    ),
  },
  {
    title: "2. Information We Collect",
    content: (
      <ul className="list-inside list-disc space-y-2">
        <li><strong>Account Information:</strong> your email address, used for verification and authentication.</li>
        <li><strong>Profile Information:</strong> name, gender, department, year, bio, photos, preferences, and interests.</li>
        <li><strong>Usage Data:</strong> swipes, likes, matches, chats, confessions, reports, and support messages.</li>
        <li><strong>Device & Log Data:</strong> browser type, IP address, timestamps, and error logs for security and debugging.</li>
      </ul>
    ),
  },
  {
    title: "3. How We Use Information",
    content: (
      <ul className="list-inside list-disc space-y-2">
        <li>To create and maintain accounts and profiles.</li>
        <li>To power discovery, matching, chat, and confessions.</li>
        <li>To moderate content, respond to reports, and improve safety.</li>
        <li>To respond to support requests and bug reports.</li>
        <li>We do <strong>not</strong> sell your data or use it for advertising.</li>
      </ul>
    ),
  },
  {
    title: "4. Data Storage & Security",
    content: (
      <p>
        Data is stored using Supabase with transport encryption and database access controls. We use Row-Level Security policies
        to limit access. No system can guarantee absolute security, but we aim to use sensible safeguards for a student platform.
      </p>
    ),
  },
  {
    title: "5. Who Can See Your Profile",
    content: (
      <ul className="list-inside list-disc space-y-2">
        <li>Other logged-in students can see visible profiles in discovery.</li>
        <li>Only mutual matches can chat.</li>
        <li>Confessions are shown anonymously unless explicitly revealed by the receiver flow.</li>
        <li>The moderation and support team may access profile/report data when needed for safety or support.</li>
      </ul>
    ),
  },
  {
    title: "6. Your Controls",
    content: (
      <ul className="list-inside list-disc space-y-2">
        <li>You can hide your profile from discovery in Settings.</li>
        <li>You can edit profile information from Profile.</li>
        <li>You can request support through the Contact page.</li>
        <li>You may delete your account from Settings, subject to the app’s grace period.</li>
      </ul>
    ),
  },
  {
    title: "7. Third-Party Services",
    content: (
      <ul className="list-inside list-disc space-y-2">
        <li><strong>Supabase:</strong> authentication, database, and storage.</li>
        <li><strong>DiceBear:</strong> generated fallback avatars using a non-personal seed.</li>
      </ul>
    ),
  },
  {
    title: "8. Contact",
    content: (
      <p>
        Questions about privacy? Reach us through the{" "}
        <Link href="/contact" className="font-semibold text-primary hover:underline">
          Contact page
        </Link>
        .
      </p>
    ),
  },
]

export default function PrivacyPolicyPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      description={`Last updated: ${LAST_UPDATED}. This page explains what Kinder collects, why we collect it, and the controls available to you.`}
    >
      <div className="rounded-[2rem] border border-border/60 bg-background/70 p-6 md:p-8">
        <div className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-violet-500/10">
          <FileText className="size-6 text-violet-500" />
        </div>
        <div className="space-y-9">
          {policySections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-lg font-bold">{section.title}</h2>
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </div>
    </PublicInfoPage>
  )
}
