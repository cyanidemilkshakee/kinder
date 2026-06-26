"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, XCircle } from "lucide-react"
import { AdminPageFrame } from "@/components/admin/AdminPageFrame"
import { AdminProfileButton } from "@/components/admin/AdminProfileButton"
import { AdminProfileModal } from "@/components/admin/AdminProfileModal"
import { Button } from "@/components/ui/button"
import { type AdminProfile } from "@/lib/admin-data"

type AdminConfession = {
  id: string
  content: string
  receiver_email: string
  receiver_username: string | null
  status: "pending" | "approved" | "rejected"
  created_at: string
  sender: AdminProfile | null
  receiver: AdminProfile | null
}

export default function AdminConfessionsPage() {
  const [confessions, setConfessions] = useState<AdminConfession[]>([])
  const [selectedProfile, setSelectedProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadConfessions = useCallback(async () => {
    const response = await fetch("/api/admin/confessions")
    const payload = await response.json()

    if (!response.ok) {
      setError(payload.error || "Unable to load confessions.")
      setConfessions([])
    } else {
      setError(null)
      setConfessions(payload.confessions || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadConfessions()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadConfessions])

  const reviewConfession = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id)
    const response = await fetch(`/api/admin/confessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(payload.error || "Unable to review confession.")
    } else {
      setConfessions((current) => current.map((confession) => (
        confession.id === id ? { ...confession, status } : confession
      )))
    }

    setBusyId(null)
  }

  const sortedConfessions = [...confessions].sort((a, b) => {
    if (a.status === b.status) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (a.status === "pending") return -1
    if (b.status === "pending") return 1
    return 0
  })

  return (
    <AdminPageFrame
      title="Confessions"
      description="Review submitted confessions. Approve the ones that can be shown, deny the ones that should stay hidden."
      loading={loading}
      error={error}
    >
      <section className="rounded-[2rem] border border-[#1C1C1C]/10 bg-white/75 p-4 shadow-sm shadow-[#1C1C1C]/5 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/6">
        <div className="mb-4">
          <h2 className="text-lg font-black">Confessions to review</h2>
          <p className="text-sm opacity-65">{confessions.filter((confession) => confession.status === "pending").length} pending</p>
        </div>

        {sortedConfessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1C1C1C]/15 p-10 text-center text-sm font-semibold opacity-60 dark:border-[#F2F2F2]/15">
            No confessions to review.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedConfessions.map((confession) => (
              <article key={confession.id} className="rounded-2xl border border-[#1C1C1C]/10 bg-white/70 p-4 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                      <span className={`rounded-full px-2.5 py-1 uppercase tracking-wider ${
                        confession.status === "pending"
                          ? "bg-[#FF6F3C]/15 text-[#CC4C1A] dark:text-[#FF9F75]"
                          : confession.status === "approved"
                            ? "bg-green-500/10 text-green-600 dark:text-green-300"
                            : "bg-red-500/10 text-red-600 dark:text-red-300"
                      }`}>
                        {confession.status}
                      </span>
                      <span className="opacity-60">{new Date(confession.created_at).toLocaleString()}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider opacity-50">From</span>
                      <AdminProfileButton profile={confession.sender} onClick={setSelectedProfile} />
                      <span className="text-xs font-black uppercase tracking-wider opacity-50">To</span>
                      {confession.receiver ? (
                        <AdminProfileButton profile={confession.receiver} onClick={setSelectedProfile} />
                      ) : (
                        <span className="rounded-full border border-[#1C1C1C]/10 bg-white/70 px-3 py-1.5 text-sm font-bold dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/7">
                          {confession.receiver_username ? `@${confession.receiver_username}` : confession.receiver_email}
                        </span>
                      )}
                    </div>

                    <p className="rounded-2xl border border-[#1C1C1C]/8 bg-[#F2F2F2]/70 p-4 text-sm font-semibold leading-relaxed dark:border-[#F2F2F2]/10 dark:bg-[#1C1C1C]/45">
                      “{confession.content}”
                    </p>
                  </div>

                  <div className="flex gap-2 lg:w-36 lg:flex-col">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 rounded-full bg-green-600 text-white hover:bg-green-700"
                      disabled={busyId === confession.id}
                      onClick={() => reviewConfession(confession.id, "approved")}
                    >
                      <CheckCircle2 className="mr-2 size-4" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="flex-1 rounded-full"
                      disabled={busyId === confession.id}
                      onClick={() => reviewConfession(confession.id, "rejected")}
                    >
                      <XCircle className="mr-2 size-4" />
                      Deny
                    </Button>
                  </div>
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
