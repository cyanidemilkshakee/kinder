"use client"

import { useCallback, useEffect, useState } from "react"
import { Bug, Mail } from "lucide-react"
import { AdminPageFrame } from "@/components/admin/AdminPageFrame"
import { AdminProfileButton } from "@/components/admin/AdminProfileButton"
import { AdminProfileModal } from "@/components/admin/AdminProfileModal"
import { type AdminProfile } from "@/lib/admin-data"

type SupportMessage = {
  id: string
  user: AdminProfile | null
  name: string | null
  message: string
  type: "bug" | "contact"
  screenshot_url?: string | null
  allow_contact?: boolean | null
  created_at: string
}

export default function AdminContactPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [selectedProfile, setSelectedProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMessages = useCallback(async () => {
    const response = await fetch("/api/admin/contact")
    const payload = await response.json()

    if (!response.ok) {
      setError(payload.error || "Unable to load contact messages.")
      setMessages([])
    } else {
      setError(null)
      setMessages(payload.messages || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMessages()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadMessages])

  return (
    <AdminPageFrame
      title="Contact"
      description="Bug reports and other support messages submitted through Settings → Contact."
      loading={loading}
      error={error}
    >
      <section className="rounded-[2rem] border border-[#1C1C1C]/10 bg-white/75 p-4 shadow-sm shadow-[#1C1C1C]/5 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/6">
        <div className="mb-4">
          <h2 className="text-lg font-black">Messages</h2>
          <p className="text-sm opacity-65">{messages.length} total messages</p>
        </div>

        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1C1C1C]/15 p-10 text-center text-sm font-semibold opacity-60 dark:border-[#F2F2F2]/15">
            No contact messages to show.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <article key={message.id} className="rounded-2xl border border-[#1C1C1C]/10 bg-white/70 p-4 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/7">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 uppercase tracking-wider ${
                      message.type === "bug"
                        ? "bg-red-500/10 text-red-600 dark:text-red-300"
                        : "bg-[#FF6F3C]/12 text-[#CC4C1A] dark:text-[#FF9F75]"
                    }`}>
                      {message.type === "bug" ? <Bug className="size-3" /> : <Mail className="size-3" />}
                      {message.type}
                    </span>
                    <span className="opacity-60">{new Date(message.created_at).toLocaleString()}</span>
                    {message.allow_contact && (
                      <span className="rounded-full bg-green-500/10 px-2.5 py-1 uppercase tracking-wider text-green-600 dark:text-green-300">
                        Contact allowed
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider opacity-50">From</span>
                    {message.user ? (
                      <AdminProfileButton profile={message.user} onClick={setSelectedProfile} />
                    ) : (
                      <span className="rounded-full border border-[#1C1C1C]/10 bg-white/70 px-3 py-1.5 text-sm font-bold dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/7">
                        {message.name || "Anonymous"}
                      </span>
                    )}
                  </div>

                  <p className="rounded-2xl border border-[#1C1C1C]/8 bg-[#F2F2F2]/70 p-4 text-sm font-semibold leading-relaxed dark:border-[#F2F2F2]/10 dark:bg-[#1C1C1C]/45">
                    {message.message}
                  </p>

                  {message.screenshot_url && (
                    <p className="break-all rounded-xl bg-[#1C1C1C]/5 px-3 py-2 text-xs font-semibold opacity-70 dark:bg-[#F2F2F2]/10">
                      Screenshot: {message.screenshot_url}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <AdminProfileModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </AdminPageFrame>
  )
}
