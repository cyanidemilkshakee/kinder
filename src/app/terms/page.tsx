import Link from "next/link"
import { PublicInfoPage } from "@/components/PublicInfoPage"

const LAST_UPDATED = "June 26, 2026"

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By creating an account or using Kinder, you agree to these Terms & Conditions and our Privacy Policy. If you do not agree, do not use the platform.",
  },
  {
    title: "2. Eligibility",
    body: "Kinder is intended for college students and campus communities. You must provide accurate account information and may not impersonate another person.",
  },
  {
    title: "3. Account Responsibility",
    body: "You are responsible for keeping your account secure and for all activity under your account. Do not share your login credentials or allow others to use your account.",
  },
  {
    title: "4. Respectful Conduct",
    body: "Harassment, hate speech, threats, spam, non-consensual sexual content, impersonation, and abusive behavior are not allowed. We may restrict, suspend, or delete accounts that violate these rules.",
  },
  {
    title: "5. Profiles, Likes, Matches, and Messages",
    body: "You agree to use discovery, likes, matches, chat, and confessions responsibly. You may not scrape, copy, or misuse other users’ information.",
  },
  {
    title: "6. Confessions and Reports",
    body: "Confessions may be reviewed or removed for safety and moderation. Reports may be used to investigate policy violations and apply restrictions or bans.",
  },
  {
    title: "7. Privacy",
    body: "Our Privacy Policy explains what data we collect and how we use it. By using Kinder, you consent to those practices.",
  },
  {
    title: "8. Service Changes",
    body: "Kinder may change, pause, or discontinue features over time. We may update these terms when needed, and continued use means you accept the updated terms.",
  },
  {
    title: "9. Contact",
    body: "If you have questions about these terms, contact us through the public Contact page.",
  },
]

export default function TermsPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal"
      title="Terms & Conditions"
      description={`Last updated: ${LAST_UPDATED}. These terms explain the basic rules for using Kinder safely and respectfully.`}
    >
      <div className="space-y-8 rounded-[2rem] border border-border/60 bg-background/70 p-6 md:p-8">
        {sections.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="text-lg font-bold">{section.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
        <p className="border-t border-border/60 pt-6 text-xs leading-relaxed text-muted-foreground">
          These terms are provided for a student-built platform and should be reviewed before production/legal launch. See also{" "}
          <Link href="/privacy" className="font-semibold text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </PublicInfoPage>
  )
}
