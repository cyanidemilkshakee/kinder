"use client"

import { useCallback, useEffect, useState } from "react"
import { Heart, Link2, Star, Trash2 } from "lucide-react"
import { AdminPageFrame } from "@/components/admin/AdminPageFrame"
import { AdminProfileButton } from "@/components/admin/AdminProfileButton"
import { AdminProfileModal } from "@/components/admin/AdminProfileModal"
import { AdminTreeSummary } from "@/components/admin/AdminTreeSummary"
import { Button } from "@/components/ui/button"
import { formatIntentBucket, type AdminProfile, type IntentBucket } from "@/lib/admin-data"

type AdminLike = {
  id: string
  swiper: AdminProfile | null
  swiped: AdminProfile | null
  intent_bucket: IntentBucket
  is_super_like: boolean
  created_at: string
}

type AdminMatch = {
  id: string
  user1: AdminProfile | null
  user2: AdminProfile | null
  created_at: string
}

type LikeStats = {
  totalLikes: number
  friendshipLikes: number
  datingLikes: number
  bothLikes: number
  matches: number
}

export default function AdminLikesPage() {
  const [likes, setLikes] = useState<AdminLike[]>([])
  const [matches, setMatches] = useState<AdminMatch[]>([])
  const [stats, setStats] = useState<LikeStats>({ totalLikes: 0, friendshipLikes: 0, datingLikes: 0, bothLikes: 0, matches: 0 })
  const [selectedProfile, setSelectedProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null)

  const loadLikes = useCallback(async () => {
    const response = await fetch("/api/admin/likes")
    const payload = await response.json()

    if (!response.ok) {
      setError(payload.error || "Unable to load likes.")
      setLikes([])
      setMatches([])
    } else {
      setError(null)
      setLikes(payload.likes || [])
      setMatches(payload.matches || [])
      setStats(payload.stats || { totalLikes: 0, friendshipLikes: 0, datingLikes: 0, bothLikes: 0, matches: 0 })
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLikes()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadLikes])

  const unmatch = async (matchId: string) => {
    setBusyMatchId(matchId)
    const response = await fetch(`/api/admin/matches/${matchId}`, { method: "DELETE" })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(payload.error || "Unable to unmatch.")
    } else {
      setMatches((current) => current.filter((match) => match.id !== matchId))
      setStats((current) => ({ ...current, matches: Math.max(0, current.matches - 1) }))
    }
    setBusyMatchId(null)
  }

  return (
    <AdminPageFrame
      title="Likes"
      description="Like and match analytics. Each row shows both profiles, and each profile chip opens the full profile card."
      loading={loading}
      error={error}
    >
      <div className="space-y-6">
        <AdminTreeSummary
          rootLabel="All likes"
          rootValue={stats.totalLikes}
          branches={[
            { label: "Friend likes", value: stats.friendshipLikes, tone: "primary" },
            { label: "Date likes", value: stats.datingLikes, tone: "accent" },
            { label: "Both", value: stats.bothLikes, tone: "dark" },
            { label: "Matches", value: stats.matches, tone: "primary" },
          ]}
        />

        <section className="rounded-[2rem] border border-[#1C1C1C]/10 bg-white/75 p-4 shadow-sm shadow-[#1C1C1C]/5 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/6">
          <h2 className="text-lg font-black">Likes</h2>
          <div className="mt-4 space-y-3">
            {likes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#1C1C1C]/15 p-8 text-center text-sm font-semibold opacity-60 dark:border-[#F2F2F2]/15">
                No likes to show.
              </div>
            ) : likes.map((like) => (
              <div key={like.id} className="rounded-2xl border border-[#1C1C1C]/10 bg-white/70 p-4 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/7">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminProfileButton profile={like.swiper} onClick={setSelectedProfile} />
                    <Heart className="size-4 fill-[#FF6F3C] text-[#FF6F3C]" />
                    <AdminProfileButton profile={like.swiped} onClick={setSelectedProfile} />
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                    <span className="rounded-full bg-[#FF6F3C]/12 px-2 py-1 text-[#CC4C1A] dark:text-[#FF9F75]">
                      {formatIntentBucket(like.intent_bucket)}
                    </span>
                    {like.is_super_like && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FF9F75]/25 px-2 py-1">
                        <Star className="size-3 fill-current" />
                        Super like
                      </span>
                    )}
                    <span className="rounded-full bg-[#1C1C1C]/5 px-2 py-1 dark:bg-[#F2F2F2]/10">
                      {new Date(like.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#1C1C1C]/10 bg-white/75 p-4 shadow-sm shadow-[#1C1C1C]/5 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/6">
          <h2 className="text-lg font-black">Matches</h2>
          <div className="mt-4 space-y-3">
            {matches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#1C1C1C]/15 p-8 text-center text-sm font-semibold opacity-60 dark:border-[#F2F2F2]/15">
                No matches to show.
              </div>
            ) : matches.map((match) => (
              <div key={match.id} className="rounded-2xl border border-[#1C1C1C]/10 bg-white/70 p-4 dark:border-[#F2F2F2]/10 dark:bg-[#F2F2F2]/7">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminProfileButton profile={match.user1} onClick={setSelectedProfile} />
                    <Link2 className="size-4 text-[#FF6F3C]" />
                    <AdminProfileButton profile={match.user2} onClick={setSelectedProfile} />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="rounded-full"
                    disabled={busyMatchId === match.id}
                    onClick={() => unmatch(match.id)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Unmatch
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <AdminProfileModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </AdminPageFrame>
  )
}
