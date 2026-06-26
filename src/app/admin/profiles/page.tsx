"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarDays, Eye, EyeOff, ShieldAlert } from "lucide-react"
import { AdminPageFrame } from "@/components/admin/AdminPageFrame"
import { AdminProfileModal } from "@/components/admin/AdminProfileModal"
import { AdminTreeSummary } from "@/components/admin/AdminTreeSummary"
import {
  formatIntentBucket,
  getDisplayName,
  getIntentBucket,
  getProfileAvatar,
  type AdminProfile,
} from "@/lib/admin-data"

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<AdminProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfiles = useCallback(async () => {
    const response = await fetch("/api/admin/profiles")
    const payload = await response.json()

    if (!response.ok) {
      setError(payload.error || "Unable to load profiles.")
      setProfiles([])
    } else {
      setError(null)
      setProfiles(payload.profiles || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfiles()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadProfiles])

  const stats = useMemo(() => {
    return profiles.reduce(
      (acc, profile) => {
        const bucket = getIntentBucket(profile)
        acc.total += 1
        acc[bucket] += 1
        return acc
      },
      { total: 0, friendship: 0, dating: 0, both: 0, unknown: 0 },
    )
  }, [profiles])

  return (
    <AdminPageFrame
      title="Profiles"
      description="Profile creation analytics and the complete user profile list. Click any profile to inspect the same profile card users see."
      loading={loading}
      error={error}
    >
      <div className="space-y-6">
        <AdminTreeSummary
          rootLabel="Profiles made"
          rootValue={stats.total}
          branches={[
            { label: "Friendship", value: stats.friendship, tone: "primary" },
            { label: "Dating", value: stats.dating, tone: "accent" },
            { label: "Both", value: stats.both, tone: "dark" },
            { label: "Unknown", value: stats.unknown, tone: "primary" },
          ]}
        />

        <section className="rounded-[2rem] border border-[#1C1C1C]/10 bg-white/75 p-4 shadow-sm shadow-[#1C1C1C]/5 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">All profiles</h2>
              <p className="text-sm opacity-65">{profiles.length} user profiles</p>
            </div>
          </div>

          {profiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1C1C1C]/15 p-10 text-center text-sm font-semibold opacity-60 dark:border-[#F2F2F2]/15">
              No profiles to show.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedProfile(profile)}
                  className="flex items-start gap-3 rounded-2xl border border-[#1C1C1C]/10 bg-white/70 p-3 text-left transition hover:border-[#FF6F3C]/45 hover:bg-[#FF6F3C]/8 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/7"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getProfileAvatar(profile)} alt="" className="size-12 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-black">{getDisplayName(profile)}</h3>
                      <span className="rounded-full bg-[#FF6F3C]/12 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#CC4C1A] dark:text-[#FF9F75]">
                        {formatIntentBucket(getIntentBucket(profile))}
                      </span>
                    </div>
                    <p className="truncate text-xs font-semibold opacity-60">@{profile.username || "unknown"} · {profile.email || "no email"}</p>
                    <p className="mt-1 truncate text-xs opacity-60">{profile.department || "Unknown branch"} · {profile.year || "Unknown year"}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#1C1C1C]/5 px-2 py-1 dark:bg-[#F2F2F2]/10">
                        {profile.is_visible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                        {profile.is_visible ? "Visible" : "Hidden"}
                      </span>
                      {profile.is_suspended && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-red-600 dark:text-red-300">
                          <ShieldAlert className="size-3" />
                          Suspended
                        </span>
                      )}
                      {profile.created_at && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1C1C1C]/5 px-2 py-1 dark:bg-[#F2F2F2]/10">
                          <CalendarDays className="size-3" />
                          {new Date(profile.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <AdminProfileModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </AdminPageFrame>
  )
}
