/* eslint-disable */
"use client"

import { use, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { X, Heart, Star, Flag, Loader2 } from "lucide-react"

type Profile = {
  id: string
  real_name: string
  department: string
  year: string
  gender: string
  bio: string | null
  relationship_intent: string
  relationship_intents: string[] | null
  avatar_url: string | null
  interest_tags: string[] | null
}

type MatchModal = {
  open: boolean
  matchedUser: Profile | null
  matchId: string | null
}

type Toast = { msg: string; type: "success" | "error" | "info" }

type ReportModal = {
  open: boolean
  targetId: string | null
  targetName: string
}

const REPORT_REASONS = [
  "Fake profile / Impersonation",
  "Inappropriate content",
  "Harassment or threats",
  "Spam",
  "Underage user",
  "Other",
]

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserHookupOpt, setCurrentUserHookupOpt] = useState(false)
  const [superLikesLeft, setSuperLikesLeft] = useState(3)
  const [swipingId, setSwipingId] = useState<string | null>(null)
  const [matchModal, setMatchModal] = useState<MatchModal>({ open: false, matchedUser: null, matchId: null })
  const [reportModal, setReportModal] = useState<ReportModal>({ open: false, targetId: null, targetName: "" })
  const [reportReason, setReportReason] = useState("")
  const [reportLoading, setReportLoading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const showToast = (msg: string, type: Toast["type"] = "info") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/"); return }
    setCurrentUserId(user.id)

    // Parallelize all independent exclusion queries + my profile in one round-trip
    const [myProfileRes, swipesRes, blocksRes, superLikesSentRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("hookup_opt_in, super_likes_today, super_likes_reset_at")
        .eq("id", user.id)
        .single(),
      supabase
        .from("swipes")
        .select("swiped_id")
        .eq("swiper_id", user.id),
      supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", user.id),
      supabase
        .from("super_likes")
        .select("receiver_id")
        .eq("sender_id", user.id),
    ])

    const myProfile = myProfileRes.data
    const swipes = swipesRes.data
    const blocks = blocksRes.data
    const superLikesSent = superLikesSentRes.data

    const hookupOpt = myProfile?.hookup_opt_in ?? false
    setCurrentUserHookupOpt(hookupOpt)

    // Reset super likes daily
    if (myProfile) {
      const resetAt = new Date(myProfile.super_likes_reset_at)
      const now = new Date()
      const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60)
      if (hoursSinceReset >= 24) {
        setSuperLikesLeft(3)
      } else {
        setSuperLikesLeft(Math.max(0, 3 - (myProfile.super_likes_today || 0)))
      }
    }

    const excludedIds = [
      user.id,
      ...(swipes?.map(s => s.swiped_id) || []),
      ...(blocks?.map(b => b.blocked_id) || []),
      ...(superLikesSent?.map(s => s.receiver_id) || []),
    ]

    let query = supabase
      .from("profiles")
      .select("id, real_name, department, year, gender, bio, relationship_intent, relationship_intents, avatar_url, interest_tags")
      .eq("is_visible", true)
      .limit(15)

    if (excludedIds.length > 0) {
      query = query.not("id", "in", `(${excludedIds.join(",")})`)
    }

    // PRD: "only compatible opted-in users should appear."
    if (hookupOpt) {
      query = query.eq("hookup_opt_in", true)
    } else {
      query = query.eq("hookup_opt_in", false)
    }

    const { data: availableProfiles } = await query
    setProfiles(availableProfiles || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const createMatch = async (userId: string, otherProfile: Profile) => {
    const user1_id = userId < otherProfile.id ? userId : otherProfile.id
    const user2_id = userId < otherProfile.id ? otherProfile.id : userId
    const { data: match } = await supabase
      .from("matches")
      .insert({ user1_id, user2_id })
      .select("id")
      .single()
    return match?.id || null
  }

  const handleSwipe = async (isRight: boolean, isSuperLike = false) => {
    if (profiles.length === 0 || !currentUserId) return
    const current = profiles[0]

    setSwipingId(current.id)
    // Let animation play
    await new Promise(r => setTimeout(r, 350))
    setSwipingId(null)
    setProfiles(prev => prev.slice(1))

    if (isSuperLike) {
      if (superLikesLeft <= 0) {
        showToast("No super likes left today! Resets in 24h.", "error")
        return
      }
      await supabase.from("super_likes").insert({ sender_id: currentUserId, receiver_id: current.id })
      setSuperLikesLeft(prev => prev - 1)
      showToast(`⭐ Super liked ${current.real_name}!`, "success")
      // Also record as a right swipe
      await supabase.from("swipes").insert({
        swiper_id: currentUserId,
        swiped_id: current.id,
        is_right_swipe: true,
      })
    } else {
      await supabase.from("swipes").insert({
        swiper_id: currentUserId,
        swiped_id: current.id,
        is_right_swipe: isRight,
      })
    }

    if (isRight || isSuperLike) {
      const { data: mutualSwipe } = await supabase
        .from("swipes")
        .select("id")
        .eq("swiper_id", current.id)
        .eq("swiped_id", currentUserId)
        .eq("is_right_swipe", true)
        .maybeSingle()

      if (mutualSwipe) {
        const matchId = await createMatch(currentUserId, current)
        setMatchModal({ open: true, matchedUser: current, matchId })
      }
    }
  }

  const handleReport = async () => {
    if (!reportReason || !reportModal.targetId || !currentUserId) return
    setReportLoading(true)
    const { error } = await supabase.from("reports").insert({
      reporter_id: currentUserId,
      reported_id: reportModal.targetId,
      reason: reportReason,
    })
    setReportLoading(false)
    setReportModal({ open: false, targetId: null, targetName: "" })
    setReportReason("")
    if (error) {
      showToast("Failed to submit report.", "error")
    } else {
      showToast("Report submitted. Our moderators will review it.", "success")
      // Remove reported user from stack
      setProfiles(prev => prev.filter(p => p.id !== reportModal.targetId))
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const current = profiles[0]
  const avatar = current?.avatar_url
    || (current ? `https://api.dicebear.com/9.x/micah/svg?seed=${current.id}&backgroundColor=ffd700,ffa500` : "")

  const intentBadges = (profile: Profile): string => {
    // Prefer the new array column; fall back to legacy single-value column
    const intents: string[] =
      (profile.relationship_intents && profile.relationship_intents.length > 0)
        ? profile.relationship_intents
        : [profile.relationship_intent]
    return intents
      .map(i => {
        if (i === "friendship") return "🤝 Friendship"
        if (i === "dating") return "💛 Dating"
        if (i === "casual") return "🔥 Casual"
        return i
      })
      .join(" · ")
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Discover</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
            <Star className="h-3.5 w-3.5 text-yellow-500" />
            <span>{superLikesLeft} super likes left</span>
          </div>
        </div>

        {profiles.length > 0 ? (
          <>
            {/* Stack indicator */}
            {profiles.length > 1 && (
              <div className="relative h-2 mb-[-8px]">
                <div className="absolute inset-x-4 top-0 h-full bg-card/80 rounded-t-2xl border border-border/40" />
              </div>
            )}

            {/* Card */}
            <div
              className={`relative bg-card rounded-2xl border border-border shadow-xl overflow-hidden transition-all duration-350 ${
                swipingId === current.id
                  ? "opacity-0 scale-95"
                  : "opacity-100 scale-100"
              }`}
            >
              {/* Avatar */}
              <div className="relative h-80 bg-gradient-to-br from-primary/20 to-secondary/20">
                <img
                  src={avatar}
                  alt={current.real_name}
                  className="w-full h-full object-cover"
                />
                {/* Report button */}
                <button
                  onClick={() => setReportModal({ open: true, targetId: current.id, targetName: current.real_name })}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/50 hover:bg-destructive/10 transition-colors"
                  title="Report user"
                >
                  <Flag className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {/* Intent badge(s) */}
                <div className="absolute bottom-3 left-3">
                  <span className="text-xs font-semibold bg-background/80 backdrop-blur-sm border border-border/50 rounded-full px-3 py-1">
                    {intentBadges(current)}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{current.real_name}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {current.department} · {current.year} Year
                    </p>
                  </div>
                  <span className="text-xs font-medium bg-muted px-2.5 py-1 rounded-full">
                    {current.gender}
                  </span>
                </div>

                {current.bio && (
                  <p className="mt-3 text-sm text-foreground/80 line-clamp-2">{current.bio}</p>
                )}

                {current.interest_tags && current.interest_tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {current.interest_tags.slice(0, 5).map(tag => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5 font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 mt-5">
                  <button
                    onClick={() => handleSwipe(false)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-destructive/30 bg-destructive/5 py-3 text-destructive font-semibold text-sm hover:bg-destructive/10 transition-all hover:scale-105 active:scale-95"
                  >
                    <X className="h-4 w-4" /> Pass
                  </button>

                  <button
                    onClick={() => handleSwipe(true, true)}
                    disabled={superLikesLeft <= 0}
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                      superLikesLeft > 0
                        ? "border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary"
                        : "border-border bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                    title={`Super like (${superLikesLeft} left today)`}
                  >
                    <Star className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleSwipe(true)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-primary/30"
                  >
                    <Heart className="h-4 w-4" /> Like
                  </button>
                </div>
              </div>
            </div>

            {/* Remaining count */}
            <p className="text-center text-xs text-muted-foreground mt-3">
              {profiles.length} {profiles.length === 1 ? "profile" : "profiles"} remaining
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-2xl border border-border shadow-sm mt-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold">You've seen everyone!</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              No more new profiles right now. Check back later — new students join every day.
            </p>
            <Button className="mt-5 rounded-xl" onClick={fetchProfiles}>
              Refresh Feed
            </Button>
          </div>
        )}
      </div>

      {/* ── MATCH MODAL ── */}
      {matchModal.open && matchModal.matchedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="animate-match-pop w-full max-w-sm rounded-3xl bg-card border border-border shadow-2xl overflow-hidden">
            {/* Gradient header */}
            <div className="relative bg-gradient-to-br from-primary/25 via-secondary/15 to-primary/10 p-8 pb-4 flex flex-col items-center">
              {/* Pulse ring */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-primary shadow-xl relative z-10">
                  <img
                    src={matchModal.matchedUser.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${matchModal.matchedUser.id}`}
                    alt={matchModal.matchedUser.real_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold tracking-tight">It's a Match!</p>
              <p className="text-sm text-muted-foreground mt-1">
                You and <span className="font-semibold text-foreground">{matchModal.matchedUser.real_name}</span> liked each other
              </p>
            </div>

            <div className="p-6 flex flex-col gap-3">
              <Button
                className="w-full rounded-xl"
                onClick={() => {
                  setMatchModal({ open: false, matchedUser: null, matchId: null })
                  if (matchModal.matchId) router.push(`/chat/${matchModal.matchId}`)
                }}
              >
                💬 Start Chatting
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => setMatchModal({ open: false, matchedUser: null, matchId: null })}
              >
                Keep Swiping
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── REPORT MODAL ── */}
      {reportModal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-bold text-lg">Report {reportModal.targetName}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Help keep Kinder safe. Select a reason:
              </p>
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {REPORT_REASONS.map(reason => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`w-full text-left text-sm rounded-xl px-4 py-2.5 border transition-all ${
                    reportReason === reason
                      ? "border-destructive/50 bg-destructive/10 text-foreground font-medium"
                      : "border-border bg-background hover:bg-muted/50"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="p-4 flex gap-3 border-t border-border">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => { setReportModal({ open: false, targetId: null, targetName: "" }); setReportReason("") }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl"
                onClick={handleReport}
                disabled={!reportReason || reportLoading}
              >
                {reportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Report"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium max-w-xs text-center ${
          toast.type === "success"
            ? "bg-primary text-primary-foreground"
            : toast.type === "error"
            ? "bg-destructive text-white"
            : "bg-card border border-border text-foreground"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
