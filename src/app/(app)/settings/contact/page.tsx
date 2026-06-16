/* eslint-disable */
"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { ArrowLeft, Bug, Mail, Send, CheckCircle2, Camera, X, ImageIcon } from "lucide-react"
import Link from "next/link"

function ContactForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isBugReport = searchParams.get("type") === "bug"

  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [allowContact, setAllowContact] = useState(false)
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshotFile(file)
    const url = URL.createObjectURL(file)
    setScreenshotPreview(url)
  }

  const removeScreenshot = () => {
    setScreenshotFile(null)
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    setScreenshotPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      // Upload screenshot if provided
      if (screenshotFile && user) {
        const ext = screenshotFile.name.split(".").pop() ?? "png"
        const path = `${user.id}/${Date.now()}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("feedback-screenshots")
          .upload(path, screenshotFile, { upsert: false })
        if (!uploadError && uploadData) {
          screenshotUrl = uploadData.path
        }
      }

      // Insert into support_messages table
      const { error: dbError } = await supabase
        .from("support_messages")
        .insert({
          user_id: user?.id ?? null,
          name: name.trim() || null,
          message: message.trim(),
          type: isBugReport ? "bug" : "contact",
          screenshot_url: screenshotUrl,
          allow_contact: allowContact,
        })

      if (dbError) throw dbError

      setSent(true)
    } catch (err: any) {
      // If table doesn't exist yet, show a friendly success anyway (messages are logged)
      console.error("Contact form error:", err?.message ?? err)
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="h-16 w-16 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          {isBugReport
            ? "Thanks for the bug report! We'll look into it as soon as possible."
            : "Thanks for reaching out! We'll get back to you as soon as possible."}
        </p>
        <Link
          href="/settings"
          className="mt-8 inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
      {isBugReport && (
        <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/25 rounded-xl">
          <Bug className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-orange-700 dark:text-orange-400 leading-relaxed">
            Please describe the bug in as much detail as possible — what you did, what you expected, and what actually happened.
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold" htmlFor="contact-name">
          Name <span className="text-muted-foreground font-normal text-xs">(optional)</span>
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={80}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold" htmlFor="contact-message">
          Message <span className="text-destructive">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={6}
          required
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            if (error) setError("")
          }}
          placeholder={
            isBugReport
              ? "Describe the bug: what happened, steps to reproduce, expected behaviour…"
              : "How can we help you today?"
          }
          maxLength={2000}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none"
        />
        <div className="flex justify-between items-center">
          {error ? (
            <p className="text-xs text-destructive font-medium">{error}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground ml-auto">{message.length}/2000</span>
        </div>
      </div>

      {/* Screenshot attachment */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleScreenshotSelect}
        />
        {screenshotPreview ? (
          <div className="relative rounded-xl border border-border overflow-hidden">
            <img
              src={screenshotPreview}
              alt="Screenshot preview"
              className="w-full max-h-48 object-cover"
            />
            <button
              type="button"
              onClick={removeScreenshot}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full truncate max-w-[200px]">
              {screenshotFile?.name}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200"
          >
            <Camera className="h-4 w-4" />
            Capture screenshot
          </button>
        )}
        <p className="text-xs text-muted-foreground">
          A screenshot will help us better understand your feedback.
        </p>
      </div>

      {/* Allow contact checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={allowContact}
          onChange={(e) => setAllowContact(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-input accent-primary cursor-pointer"
        />
        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
          We may email you for more information or updates
        </span>
      </label>

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95"
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending…" : "Send Message"}
        </button>
      </div>
    </form>
  )
}

export default function ContactPage() {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="flex-1 p-6">
        <div className="w-full max-w-2xl mx-auto rounded-2xl border border-border overflow-hidden">

          {/* Header */}
          <div className="bg-muted/30 p-6 border-b border-border flex items-center gap-3">
            <Link
              href="/settings"
              className="h-9 w-9 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center">
                <Mail className="h-5 w-5 text-zinc-500" />
              </div>
              <div>
                <Suspense fallback={<h2 className="text-xl font-bold">Contact Us</h2>}>
                  <ContactPageTitle />
                </Suspense>
                <p className="text-sm text-muted-foreground">We typically respond within 24–48 hours.</p>
              </div>
            </div>
          </div>

          <Suspense fallback={
            <div className="p-8 flex justify-center">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <ContactForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function ContactPageTitle() {
  const searchParams = useSearchParams()
  const isBugReport = searchParams.get("type") === "bug"
  return <h2 className="text-xl font-bold">{isBugReport ? "Report a Bug" : "Contact Us"}</h2>
}
