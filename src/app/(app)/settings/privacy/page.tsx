/* eslint-disable */
"use client"

import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"

type PolicySection = {
  title: string
  content: React.ReactNode
}

const LAST_UPDATED = "June 15, 2025"

const policySections: PolicySection[] = [
  {
    title: "1. Who We Are",
    content: (
      <p>
        Kinder ("Kinder", "we", "us", or "our") is a campus-exclusive social platform
        operated for college students. We are not affiliated with college administration.
        This Privacy Policy explains how we collect, use, and protect your personal
        information when you use the Kinder platform.
      </p>
    ),
  },
  {
    title: "2. Information We Collect",
    content: (
      <ul className="list-disc list-inside space-y-2">
        <li><strong>Account Information:</strong> Your college email address, used for verification and authentication.</li>
        <li><strong>Profile Information:</strong> Your real name, gender, department, year of study, date of birth, bio, interest tags, and profile photo.</li>
        <li><strong>Usage Data:</strong> Profile views, swipe activity (likes/passes), match events, and chat messages.</li>
        <li><strong>Confessions:</strong> Anonymous text posts submitted to the Confessions feed.</li>
        <li><strong>Support Messages:</strong> Messages and bug reports you send to us through the Contact Us form.</li>
        <li><strong>Device &amp; Log Data:</strong> Browser type, IP address, timestamps, and error logs collected automatically for security and debugging purposes.</li>
      </ul>
    ),
  },
  {
    title: "3. How We Use Your Information",
    content: (
      <ul className="list-disc list-inside space-y-2">
        <li>To create and maintain your account and profile.</li>
        <li>To facilitate matching, chat, and discovery features.</li>
        <li>To enforce eligibility restrictions (e.g., 18+ for casual intent).</li>
        <li>To moderate confessions and respond to reports.</li>
        <li>To respond to support requests and bug reports.</li>
        <li>To improve platform performance, security, and features.</li>
        <li>We do <strong>not</strong> sell your data to third parties.</li>
        <li>We do <strong>not</strong> use your data for advertising.</li>
      </ul>
    ),
  },
  {
    title: "4. Data Storage & Security",
    content: (
      <p>
        All data is stored securely using <strong>Supabase</strong>, which is hosted on AWS infrastructure
        with encryption at rest and in transit (TLS). Access to the database is governed by
        Row-Level Security (RLS) policies, ensuring you can only access your own data.
        Profile photos are stored in a private storage bucket with per-user access controls.
        While we implement industry-standard safeguards, no system can guarantee absolute security.
      </p>
    ),
  },
  {
    title: "5. Who Can See Your Profile",
    content: (
      <ul className="list-disc list-inside space-y-2">
        <li>Your profile is visible to other verified college students who are logged into Kinder.</li>
        <li>Only mutual matches can start a conversation with you.</li>
        <li>Confessions are posted anonymously - your name is never attached to a confession publicly.</li>
        <li>Platform administrators (the developer) can access profile data for moderation and support purposes only.</li>
      </ul>
    ),
  },
  {
    title: "6. Your Rights & Controls",
    content: (
      <ul className="list-disc list-inside space-y-2">
        <li><strong>Profile Visibility:</strong> You can hide your profile from discovery at any time in Settings.</li>
        <li><strong>Data Access:</strong> You can view all your profile data from the Profile page.</li>
        <li><strong>Account Deletion:</strong> You may delete your account from Settings → Danger Zone. After a 7-day grace period, all your data (profile, matches, messages) is permanently and irreversibly deleted.</li>
        <li><strong>Data Correction:</strong> You can edit most of your profile information directly from the Profile page.</li>
        <li><strong>Contact Us:</strong> For any data-related requests not covered above, contact us through Settings → Contact Us.</li>
      </ul>
    ),
  },
  {
    title: "7. Data Retention",
    content: (
      <p>
        We retain your data for as long as your account is active. If you delete your account,
        all personal data is removed after the 7-day grace period. Anonymized analytical data
        (e.g., aggregate match counts with no personal identifiers) may be retained
        indefinitely for platform improvement.
      </p>
    ),
  },
  {
    title: "8. Third-Party Services",
    content: (
      <ul className="list-disc list-inside space-y-2">
        <li><strong>Supabase:</strong> Database, authentication, and storage provider. Subject to Supabase's own Privacy Policy.</li>
        <li><strong>DiceBear (api.dicebear.com):</strong> Used to generate default avatar images based on your user ID. No personal data is sent - only a random seed is used.</li>
        <li>We do not use Google Analytics, Meta Pixel, or any other advertising trackers.</li>
      </ul>
    ),
  },
  {
    title: "9. Minors",
    content: (
      <p>
        Kinder is intended for college students and requires a college email for sign-up.
        Certain features (Casual / Hookup Intent) are restricted to users aged 18 and above,
        verified by date of birth during onboarding. If we become aware that a minor has
        misrepresented their age, we will suspend their account.
      </p>
    ),
  },
  {
    title: "10. Changes to This Policy",
    content: (
      <p>
        We may update this Privacy Policy from time to time. Material changes will be
        communicated via an in-app notification or email. Continued use of Kinder after
        changes are posted constitutes acceptance of the updated policy. The "Last Updated"
        date at the top of this page reflects the most recent revision.
      </p>
    ),
  },
  {
    title: "11. Contact",
    content: (
      <p>
        If you have any questions or concerns about this Privacy Policy or our data practices,
        please reach out through{" "}
        <Link href="/settings/contact" className="text-primary font-semibold hover:underline">
          Settings → Contact Us
        </Link>
        . We aim to respond within 48 hours.
      </p>
    ),
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="flex-1 p-6 md:p-12">
        <div className="w-full max-w-2xl mx-auto space-y-12">

          {/* Header */}
          <div className="space-y-6">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Settings
            </Link>
            
            <div className="space-y-4">
              <FileText className="h-10 w-10 text-violet-500 mb-2" />
              <h2 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h2>
              <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
            </div>

            <div className="text-sm text-muted-foreground leading-relaxed pt-2">
              <p>
                This Privacy Policy describes how Kinder collects, uses, and protects
                your personal information. By using Kinder, you agree to the practices described below.
                Please read this carefully.
              </p>
            </div>
          </div>

          {/* Policy sections */}
          <div className="space-y-10">
            {policySections.map((section) => (
              <div key={section.title} className="space-y-3">
                <h3 className="font-bold text-lg">{section.title}</h3>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-8">
            <p className="text-xs text-muted-foreground">
              Kinder · Campus-exclusive · Not affiliated with college administration
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
