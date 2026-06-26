"use client"

import { useCallback, useEffect, useState } from "react"
import { Ban, Eye, ShieldAlert } from "lucide-react"
import { AdminPageFrame } from "@/components/admin/AdminPageFrame"
import { AdminProfileButton } from "@/components/admin/AdminProfileButton"
import { AdminProfileModal } from "@/components/admin/AdminProfileModal"
import { Button } from "@/components/ui/button"
import { type AdminProfile } from "@/lib/admin-data"

type AdminReport = {
  id: string
  reason: string
  status: string
  created_at: string
  reporter: AdminProfile | null
  reported: AdminProfile | null
  reported_id: string
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [selectedProfile, setSelectedProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const loadReports = useCallback(async () => {
    const response = await fetch("/api/admin/reports")
    const payload = await response.json()

    if (!response.ok) {
      setError(payload.error || "Unable to load reports.")
      setReports([])
    } else {
      setError(null)
      setReports(payload.reports || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadReports])

  const runProfileAction = async (profileId: string, action: "suspend" | "ban" | "visible" | "unsuspend") => {
    setBusyKey(`${profileId}:${action}`)
    const response = await fetch(`/api/admin/profiles/${profileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, days: 7 }),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(payload.error || "Unable to update profile.")
    } else {
      const updatedProfile = payload.profile as AdminProfile
      setReports((current) => current.map((report) => (
        report.reported_id === updatedProfile.id
          ? { ...report, reported: updatedProfile }
          : report
      )))
      setSelectedProfile((current) => current?.id === updatedProfile.id ? updatedProfile : current)
    }

    setBusyKey(null)
  }

  return (
    <AdminPageFrame
      title="Reports"
      description="Review user reports and take quick moderation actions on reported profiles."
      loading={loading}
      error={error}
    >
      <section className="rounded-[2rem] border border-[#1C1C1C]/10 bg-white/75 p-4 shadow-sm shadow-[#1C1C1C]/5 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/6">
        <div className="mb-4">
          <h2 className="text-lg font-black">All reports</h2>
          <p className="text-sm opacity-65">{reports.length} total reports</p>
        </div>

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1C1C1C]/15 p-10 text-center text-sm font-semibold opacity-60 dark:border-[#F2F2F2]/15">
            No reports to show.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const isBanned = report.reported?.ban_expires_at && new Date(report.reported.ban_expires_at) > new Date()
              return (
                <article key={report.id} className="rounded-2xl border border-[#1C1C1C]/10 bg-white/70 p-4 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/7">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        <span className="rounded-full bg-[#FF6F3C]/12 px-2.5 py-1 uppercase tracking-wider text-[#CC4C1A] dark:text-[#FF9F75]">
                          {report.status}
                        </span>
                        <span className="opacity-60">{new Date(report.created_at).toLocaleString()}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider opacity-50">Reported</span>
                        <AdminProfileButton profile={report.reported} onClick={setSelectedProfile} />
                        <span className="text-xs font-black uppercase tracking-wider opacity-50">By</span>
                        <AdminProfileButton profile={report.reporter} onClick={setSelectedProfile} />
                      </div>

                      <p className="rounded-2xl border border-[#1C1C1C]/8 bg-[#F2F2F2]/70 p-4 text-sm font-semibold leading-relaxed dark:border-[#F2F2F2]/10 dark:bg-[#1C1C1C]/45">
                        {report.reason}
                      </p>

                      <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                        <span className={`rounded-full px-2 py-1 ${report.reported?.is_visible ? "bg-green-500/10 text-green-600 dark:text-green-300" : "bg-[#1C1C1C]/5 dark:bg-[#F2F2F2]/10"}`}>
                          {report.reported?.is_visible ? "Visible" : "Hidden"}
                        </span>
                        {report.reported?.is_suspended && (
                          <span className="rounded-full bg-red-500/10 px-2 py-1 text-red-600 dark:text-red-300">Suspended</span>
                        )}
                        {isBanned && (
                          <span className="rounded-full bg-[#FF6F3C]/12 px-2 py-1 text-[#CC4C1A] dark:text-[#FF9F75]">
                            Banned until {new Date(report.reported!.ban_expires_at!).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {report.reported && (
                      <div className="grid gap-2 sm:grid-cols-2 xl:w-64 xl:grid-cols-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="rounded-full"
                          disabled={busyKey === `${report.reported.id}:suspend`}
                          onClick={() => runProfileAction(report.reported!.id, "suspend")}
                        >
                          <ShieldAlert className="mr-2 size-4" />
                          Suspend
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-full bg-[#CC4C1A] text-white hover:bg-[#a53d14]"
                          disabled={busyKey === `${report.reported.id}:ban`}
                          onClick={() => runProfileAction(report.reported!.id, "ban")}
                        >
                          <Ban className="mr-2 size-4" />
                          7-day ban
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="rounded-full"
                          disabled={busyKey === `${report.reported.id}:visible`}
                          onClick={() => runProfileAction(report.reported!.id, "visible")}
                        >
                          <Eye className="mr-2 size-4" />
                          Make visible
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <AdminProfileModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </AdminPageFrame>
  )
}
