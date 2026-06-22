/* eslint-disable */
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Flag, Heart, Loader2, Star, X } from "lucide-react"
import { ProfilePostCard, type ProfileSwipeDirection } from "@/components/ProfilePostCard"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/client"
import {
  RELATIONSHIP_INTENTS,
  RelationshipIntent,
  formatRelationshipIntent,
  normalizeRelationshipIntents,
} from "@/lib/profile-options"

type Profile = {
  id: string
  username: string
  real_name: string
  department: string
  year: string
  gender: string
  bio: string | null
  relationship_intent: string
  relationship_intents: string[] | null
  avatar_url: string | null
  photos: string[] | null
  interest_tags: string[] | null
  food_preference: string | null
  drinking_habit: string | null
  smoking_habit: string | null
}

type DiscoveryPreferences = {
  interested_interests: string[] | null
  interested_departments: string[] | null
  interested_years: string[] | null
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

type TouchPoint = {
  x: number
  y: number
}

const REPORT_REASONS = [
  "Fake profile / Impersonation",
  "Inappropriate content",
  "Harassment or threats",
  "Spam",
  "Underage user",
  "Other",
]

function profileMatchesPreferences(profile: Profile, preferences: DiscoveryPreferences) {
  const selectedDepartments = preferences.interested_departments || []
  const selectedYears = preferences.interested_years || []
  const selectedInterests = preferences.interested_interests || []

  if (selectedDepartments.length > 0 && !selectedDepartments.includes(profile.department)) {
    return false
  }

  if (selectedYears.length > 0 && !selectedYears.includes(profile.year)) {
    return false
  }

  if (selectedInterests.length > 0) {
    const profileInterests = profile.interest_tags || []
    return selectedInterests.some((interest) => profileInterests.includes(interest))
  }

  return true
}

function profileHasIntent(profile: Profile, intent: RelationshipIntent) {
  return normalizeRelationshipIntents(profile.relationship_intents, profile.relationship_intent).includes(intent)
}

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeIntent, setActiveIntent] = useState<RelationshipIntent>("friendship")
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [viewerProfile, setViewerProfile] = useState<Profile | null>(null)
  const [superLikesLeft, setSuperLikesLeft] = useState(3)
  const [swipingId, setSwipingId] = useState<string | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<ProfileSwipeDirection | null>(null)
  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null)
  const [matchModal, setMatchModal] = useState<MatchModal>({ open: false, matchedUser: null, matchId: null })
  const [reportModal, setReportModal] = useState<ReportModal>({ open: false, targetId: null, targetName: "" })
  const [reportReason, setReportReason] = useState("")
  const [reportLoading, setReportLoading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  const showToast = (msg: string, type: Toast["type"] = "info") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/")
      return
    }
    setCurrentUserId(user.id)

    const [myProfileRes, swipesRes, blocksRes, blockedByRes, superLikesSentRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, real_name, department, year, gender, bio, relationship_intent, relationship_intents, avatar_url, photos, interest_tags, food_preference, drinking_habit, smoking_habit, super_likes_today, super_likes_reset_at, interested_interests, interested_departments, interested_years")
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
        .from("blocks")
        .select("blocker_id")
        .eq("blocked_id", user.id),
      supabase
        .from("super_likes")
        .select("receiver_id")
        .eq("sender_id", user.id),
    ])

    const myProfile = myProfileRes.data
    const swipes = swipesRes.data
    const blocks = blocksRes.data
    const blockedBy = blockedByRes.data
    const superLikesSent = superLikesSentRes.data

    if (myProfile) {
      setViewerProfile(myProfile as Profile)
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
      ...(swipes?.map((s) => s.swiped_id) || []),
      ...(blocks?.map((b) => b.blocked_id) || []),
      ...(blockedBy?.map((b) => b.blocker_id) || []),
      ...(superLikesSent?.map((s) => s.receiver_id) || []),
    ]

    let query = supabase
      .from("profiles")
      .select("id, username, real_name, department, year, gender, bio, relationship_intent, relationship_intents, avatar_url, photos, interest_tags, food_preference, drinking_habit, smoking_habit")
      .eq("is_visible", true)
      .limit(30)

    if (excludedIds.length > 0) {
      query = query.not("id", "in", `(${excludedIds.join(",")})`)
    }

    const { data: availableProfiles } = await query
    const preferences: DiscoveryPreferences = {
      interested_interests: myProfile?.interested_interests || [],
      interested_departments: myProfile?.interested_departments || [],
      interested_years: myProfile?.interested_years || [],
    }

    setProfiles((availableProfiles || []).filter((profile) => profileMatchesPreferences(profile, preferences)))
    setActivePhotoIndex(0)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const groupedProfiles = useMemo(() => {
    return {
      friendship: profiles.filter((profile) => profileHasIntent(profile, "friendship")),
      dating: profiles.filter((profile) => profileHasIntent(profile, "dating")),
    }
  }, [profiles])

  const activeProfiles = groupedProfiles[activeIntent]
  const current = activeProfiles[0]

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

  const handleSwipe = async (
    isRight: boolean,
    isSuperLike = false,
    direction: ProfileSwipeDirection = isRight ? "right" : "left",
  ) => {
    if (!current || !currentUserId || swipingId) return

    if (isSuperLike && superLikesLeft <= 0) {
      showToast("No super likes left today! Resets in 24h.", "error")
      return
    }

    setSwipingId(current.id)
    setSwipeDirection(direction)
    await new Promise((resolve) => setTimeout(resolve, 350))
    setSwipingId(null)
    setSwipeDirection(null)
    setProfiles((prev) => prev.filter((profile) => profile.id !== current.id))
    setActivePhotoIndex(0)

    if (isSuperLike) {
      await supabase.from("super_likes").insert({ sender_id: currentUserId, receiver_id: current.id })
      setSuperLikesLeft((prev) => prev - 1)
      showToast(`Super liked ${current.real_name}!`, "success")
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
      setProfiles((prev) => prev.filter((profile) => profile.id !== reportModal.targetId))
    }
  }

  const handleNextPhoto = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (!current) return
    const allPhotos = current.photos?.filter(Boolean) || []
    const photoCount = allPhotos.length > 0 ? allPhotos.length : 1
    if (activePhotoIndex < photoCount - 1) {
      setActivePhotoIndex((prev) => prev + 1)
    }
  }

  const handlePrevPhoto = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (activePhotoIndex > 0) {
      setActivePhotoIndex((prev) => prev - 1)
    }
  }

  const handleCardTouchStart = (event: React.TouchEvent) => {
    const touch = event.changedTouches[0]
    if (!touch) return
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }

  const handleCardTouchEnd = (event: React.TouchEvent) => {
    if (!touchStart || !current) return

    const touch = event.changedTouches[0]
    if (!touch) return

    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    const threshold = 60

    setTouchStart(null)

    if (Math.max(absX, absY) < threshold) return

    if (absX >= absY) {
      handleSwipe(deltaX > 0, false, deltaX > 0 ? "right" : "left")
      return
    }

    if (deltaY < 0) {
      if (window.confirm(`Super like ${current.real_name}?`)) {
        handleSwipe(true, true, "up")
      }
      return
    }

    if (window.confirm(`Report ${current.real_name}?`)) {
      setReportModal({ open: true, targetId: current.id, targetName: current.real_name })
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const avatar = current?.avatar_url
    || (current ? `https://api.dicebear.com/9.x/micah/svg?seed=${current.id}&backgroundColor=ffd700,ffa500` : "")
  const allPhotos = current ? (current.photos || []).filter(Boolean) as string[] : []
  if (allPhotos.length === 0 && current) {
    allPhotos.push(avatar)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-4 sm:p-6">
      <div className="sticky top-0 z-20 -mx-4 bg-background/95 px-4 pb-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight">Discover</h1>
            <div className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-primary" />
              <span>{superLikesLeft} super likes left</span>
            </div>
          </div>

          <div className="mx-auto grid w-full grid-cols-2 rounded-lg border bg-muted/35 p-1 lg:w-3/4">
            {RELATIONSHIP_INTENTS.map((intent) => {
              const count = groupedProfiles[intent.value].length
              return (
                <button
                  key={intent.value}
                  type="button"
                  onClick={() => {
                    setActiveIntent(intent.value)
                    setActivePhotoIndex(0)
                  }}
                  className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                    activeIntent === intent.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {formatRelationshipIntent(intent.value)}
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden py-2 sm:py-3">
        {current ? (
          <div className="mx-auto flex w-full max-w-[1240px] items-center justify-center gap-3 px-2 sm:gap-4">
            <div className="hidden flex-col items-center gap-4 md:flex">
              <button
                type="button"
                onClick={() => handleSwipe(false, false, "left")}
                className="flex size-16 items-center justify-center rounded-full border-2 border-destructive bg-background text-destructive shadow-lg transition hover:scale-105 hover:bg-destructive hover:text-black active:scale-95"
                aria-label="Pass"
                title="Pass"
              >
                <X className="h-8 w-8" />
              </button>
              <button
                type="button"
                onClick={() => setReportModal({ open: true, targetId: current.id, targetName: current.real_name })}
                className="flex size-12 items-center justify-center rounded-full border border-destructive/40 bg-background text-destructive shadow-md transition hover:scale-105 hover:bg-destructive/10 active:scale-95"
                aria-label="Report"
                title="Report"
              >
                <Flag className="h-5 w-5" />
              </button>
            </div>

            <div className="w-full max-w-4xl xl:max-w-5xl">
              <ProfilePostCard
                profile={current}
                viewerProfile={viewerProfile}
                avatarUrl={avatar}
                photos={allPhotos}
                activePhotoIndex={activePhotoIndex}
                onPrevPhoto={handlePrevPhoto}
                onNextPhoto={handleNextPhoto}
                swipeDirection={swipingId === current.id ? swipeDirection : null}
                onTouchStart={handleCardTouchStart}
                onTouchEnd={handleCardTouchEnd}
              />
            </div>

            <div className="hidden flex-col items-center gap-4 md:flex">
              <button
                type="button"
                onClick={() => handleSwipe(true, false, "right")}
                className="flex size-16 items-center justify-center rounded-full border-2 border-primary bg-background text-primary shadow-lg transition hover:scale-105 hover:bg-primary hover:text-primary-foreground active:scale-95"
                aria-label="Like"
                title="Like"
              >
                <Heart className="h-8 w-8" />
              </button>
              <button
                type="button"
                onClick={() => handleSwipe(true, true, "up")}
                disabled={superLikesLeft <= 0}
                className="flex size-12 items-center justify-center rounded-full border border-primary/40 bg-background text-primary shadow-md transition hover:scale-105 hover:bg-primary/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Super like"
                title={`${superLikesLeft} super likes left`}
              >
                <Star className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold">No {formatRelationshipIntent(activeIntent).toLowerCase()} profiles right now</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Check the other group, adjust your Interested In settings, or refresh later as more students join.
            </p>
            <Button className="mt-5 rounded-lg" onClick={fetchProfiles}>
              Refresh Feed
            </Button>
          </div>
        )}
      </div>

      {matchModal.open && matchModal.matchedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="animate-match-pop w-full max-w-sm overflow-hidden rounded-lg border bg-background">
            <div className="flex flex-col items-center bg-muted/40 p-8 pb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
                <div className="relative z-10 size-24 overflow-hidden rounded-full border-4 border-primary">
                  <img
                    src={matchModal.matchedUser.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${matchModal.matchedUser.id}`}
                    alt={matchModal.matchedUser.real_name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold tracking-tight">It's a Match!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You and <span className="font-semibold text-foreground">{matchModal.matchedUser.real_name}</span> liked each other
              </p>
            </div>

            <div className="flex flex-col gap-3 p-6">
              <Button
                className="w-full rounded-lg"
                onClick={() => {
                  setMatchModal({ open: false, matchedUser: null, matchId: null })
                  if (matchModal.matchId) router.push(`/chat/${matchModal.matchId}`)
                }}
              >
                Start Chatting
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-lg"
                onClick={() => setMatchModal({ open: false, matchedUser: null, matchId: null })}
              >
                Keep Swiping
              </Button>
            </div>
          </div>
        </div>
      )}

      {reportModal.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm overflow-hidden rounded-lg border bg-background">
            <div className="border-b p-5">
              <h3 className="text-lg font-bold">Report {reportModal.targetName}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Help keep Kinder safe. Select a reason:</p>
            </div>
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto p-4">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all ${
                    reportReason === reason
                      ? "border-destructive/50 bg-destructive/10 font-medium text-foreground"
                      : "border-border bg-background hover:bg-muted/50"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-3 border-t p-4">
              <Button
                variant="outline"
                className="flex-1 rounded-lg"
                onClick={() => {
                  setReportModal({ open: false, targetId: null, targetName: "" })
                  setReportReason("")
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-lg"
                onClick={handleReport}
                disabled={!reportReason || reportLoading}
              >
                {reportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-50 flex max-w-xs -translate-x-1/2 items-center gap-2 rounded-lg border px-5 py-3 text-center text-sm font-medium ${
          toast.type === "success"
            ? "border-primary/50 bg-primary text-primary-foreground"
            : toast.type === "error"
              ? "border-destructive/50 bg-destructive text-white"
              : "border-border bg-background text-foreground"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
