"use client"

import { Suspense, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Bug, Camera, CheckCircle2, Mail, Send, X } from "lucide-react"
import { createClient } from "@/lib/client"
import { PublicInfoPage } from "@/components/PublicInfoPage"

function ContactPageTitle() {
  const searchParams = useSearchParams()
  const isBugReport = searchParams.get("type") === "bug"
  return (
    <PublicInfoPage
      title={isBugReport ? "Report a Bug" : "Contact Us"}
      description={isBugReport
        ? "Tell us what broke, what you expected, and what happened instead."
        : "Send feedback, questions, or anything else we should know."}
    >
      <ContactForm isBugReport={isBugReport} />
    </PublicInfoPage>
  )
}

function ContactForm({ isBugReport }: { isBugReport: boolean }) {
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [allowContact, setAllowContact] = useState(false)
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleScreenshotSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setScreenshotFile(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }

  const removeScreenshot = () => {
    setScreenshotFile(null)
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    setScreenshotPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!message.trim()) {
      setError("Message is required.")
      return
    }

    setSending(true)
    setError("")

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      let screenshotUrl: string | null = null

      if (screenshotFile && user) {
        const ext = screenshotFile.name.split(".").pop() ?? "png"
        const path = `${user.id}/${Date.now()}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("feedback-screenshots")
          .upload(path, screenshotFile, { upsert: false })
        if (uploadError) throw uploadError
        screenshotUrl = uploadData?.path || null
      }

      if (screenshotFile && !user) {
        throw new Error("Please sign in before attaching a screenshot.")
      }

      const { error: insertError } = await supabase.from("support_messages").insert({
        user_id: user?.id ?? null,
        name: name.trim() || null,
        message: message.trim(),
        type: isBugReport ? "bug" : "contact",
        screenshot_url: screenshotUrl,
        allow_contact: allowContact,
      })
      if (insertError) throw insertError

      setSent(true)
    } catch (err) {
      console.error("Contact form error:", err)
      setError(err instanceof Error ? err.message : "Message could not be sent. Please try again.")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-[2rem] border border-border/60 bg-background/70 px-6 py-14 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Message sent</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Thanks — we’ll look into it as soon as possible.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-border/60 bg-background/70 p-6 md:p-8">
      <div className={`flex items-start gap-3 rounded-2xl border p-4 ${isBugReport ? "border-orange-500/25 bg-orange-500/10" : "border-primary/25 bg-primary/10"}`}>
        {isBugReport ? <Bug className="mt-0.5 size-4 shrink-0 text-orange-500" /> : <Mail className="mt-0.5 size-4 shrink-0 text-primary" />}
        <p className="text-sm leading-relaxed text-muted-foreground">
          {isBugReport
            ? "Screenshots and steps to reproduce help a lot."
            : "You can send this while signed out too. Add your name if you want us to know who sent it."}
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold" htmlFor="contact-name">Name <span className="font-normal text-muted-foreground">(optional)</span></label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          maxLength={80}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold" htmlFor="contact-message">Message <span className="text-destructive">*</span></label>
        <textarea
          id="contact-message"
          rows={6}
          required
          value={message}
          onChange={(event) => {
            setMessage(event.target.value)
            if (error) setError("")
          }}
          placeholder={isBugReport ? "What happened? How can we reproduce it?" : "How can we help?"}
          maxLength={2000}
          className="w-full resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-medium text-destructive">{error}</p>
          <span className="ml-auto text-xs text-muted-foreground">{message.length}/2000</span>
        </div>
      </div>

      <div className="space-y-2">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleScreenshotSelect} />
        {screenshotPreview ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={screenshotPreview} alt="Screenshot preview" className="max-h-48 w-full object-cover" />
            <button
              type="button"
              onClick={removeScreenshot}
              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            <Camera className="size-4" />
            Attach screenshot
          </button>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={allowContact}
          onChange={(event) => setAllowContact(event.target.checked)}
          className="mt-0.5 size-4 cursor-pointer rounded border-input accent-primary"
        />
        <span className="text-sm leading-snug text-muted-foreground">
          We may email you for more information or updates
        </span>
      </label>

      <button
        type="submit"
        disabled={sending || !message.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="size-4" />
        {sending ? "Sending…" : "Send Message"}
      </button>
    </form>
  )
}

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <PublicInfoPage title="Contact Us" description="Loading contact form…">
          <div className="rounded-[2rem] border border-border/60 bg-background/70 p-8 text-sm text-muted-foreground">
            Loading…
          </div>
        </PublicInfoPage>
      }
    >
      <ContactPageTitle />
    </Suspense>
  )
}
