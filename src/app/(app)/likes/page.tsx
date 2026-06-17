/* eslint-disable */
"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { X, Heart, Loader2, Star } from "lucide-react"

type Liker = {
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
  isSuperLike: boolean
}

type TabType = "friendships" | "dating" | "hookups"

export default function LikesPage() {
  const [friendshipLikers, setFriendshipLikers] = useState<Liker[]>([])
  const [datingLikers, setDatingLikers] = useState<Liker[]>([])
  const [hookupLikers, setHookupLikers] = useState<Liker[]>([])
  const [activeTab, setActiveTab] = useState<TabType>("friendships")

  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [swipingId, setSwipingId] = useState<string | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [matchModal, setMatchModal] = useState<{ open: boolean; matchedUser: Liker | null; matchId: string | null }>({ open: false, matchedUser: null, matchId: null })
  
  const supabase = createClient()
  const router = useRouter()

  const fetchLikers = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/"); return }
    setCurrentUserId(user.id)

    // Get right-swipes on me, my own swipes, and super likes on me
    const [rightSwipesRes, mySwipesRes, superLikesRes] = await Promise.all([
      supabase.from("swipes").select("swiper_id").eq("swiped_id", user.id).eq("is_right_swipe", true),
      supabase.from("swipes").select("swiped_id").eq("swiper_id", user.id),
      supabase.from("super_likes").select("sender_id").eq("receiver_id", user.id),
    ])

    const rightSwipes = rightSwipesRes.data || []
    const mySwipedIds = new Set((mySwipesRes.data || []).map(s => s.swiped_id))
    const superLikerIds = new Set((superLikesRes.data || []).map(s => s.sender_id))

    const pendingLikerIds = rightSwipes.map(s => s.swiper_id).filter(id => !mySwipedIds.has(id))

    if (pendingLikerIds.length === 0) {
      setFriendshipLikers([])
      setDatingLikers([])
      setHookupLikers([])
      setLoading(false)
      return
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, real_name, department, year, gender, bio, relationship_intent, relationship_intents, avatar_url, photos, interest_tags")
      .in("id", pendingLikerIds)
      .eq("is_visible", true)

    const enrichedProfiles: Liker[] = (profiles || []).map(p => ({
      ...p,
      isSuperLike: superLikerIds.has(p.id)
    }))

    // Sort function: Super likes first
    const sortLikers = (a: Liker, b: Liker) => {
      return (b.isSuperLike ? 1 : 0) - (a.isSuperLike ? 1 : 0)
    }

    const friendships = enrichedProfiles.filter(p => {
      const intents = p.relationship_intents && p.relationship_intents.length > 0 ? p.relationship_intents : [p.relationship_intent]
      return intents.includes('friendship')
    }).sort(sortLikers)

    const dating = enrichedProfiles.filter(p => {
      const intents = p.relationship_intents && p.relationship_intents.length > 0 ? p.relationship_intents : [p.relationship_intent]
      return intents.includes('dating')
    }).sort(sortLikers)

    const hookups = enrichedProfiles.filter(p => {
      const intents = p.relationship_intents && p.relationship_intents.length > 0 ? p.relationship_intents : [p.relationship_intent]
      return intents.includes('casual')
    }).sort(sortLikers)

    setFriendshipLikers(friendships)
    setDatingLikers(dating)
    setHookupLikers(hookups)
    
    // Automatically select the first non-empty tab if possible
    if (friendships.length === 0) {
      if (dating.length > 0) setActiveTab("dating")
      else if (hookups.length > 0) setActiveTab("hookups")
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLikers()
  }, [fetchLikers])

  const getActiveList = () => {
    if (activeTab === "friendships") return friendshipLikers
    if (activeTab === "dating") return datingLikers
    return hookupLikers
  }

  const handleSwipe = async (isRight: boolean) => {
    const currentList = getActiveList()
    if (currentList.length === 0 || !currentUserId) return
    const current = currentList[0]

    setSwipingId(current.id)
    setSwipeDirection(isRight ? "right" : "left")
    
    // Let animation play
    await new Promise(r => setTimeout(r, 350))
    setSwipingId(null)
    setSwipeDirection(null)
    setActivePhotoIndex(0)

    // Remove from all lists so they don't reappear if we switch tabs
    setFriendshipLikers(prev => prev.filter(p => p.id !== current.id))
    setDatingLikers(prev => prev.filter(p => p.id !== current.id))
    setHookupLikers(prev => prev.filter(p => p.id !== current.id))

    // Record swipe
    await supabase.from("swipes").insert({
      swiper_id: currentUserId,
      swiped_id: current.id,
      is_right_swipe: isRight,
    })

    if (isRight) {
      // It's a guaranteed match since they already liked us!
      const user1_id = currentUserId < current.id ? currentUserId : current.id
      const user2_id = currentUserId < current.id ? current.id : currentUserId
      
      const { data: match } = await supabase
        .from("matches")
        .insert({ user1_id, user2_id })
        .select("id")
        .single()
        
      if (match) {
        setMatchModal({ open: true, matchedUser: current, matchId: match.id })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const activeLikers = getActiveList()
  const current = activeLikers[0]
  
  const avatar = current?.avatar_url
    || (current ? `https://api.dicebear.com/9.x/micah/svg?seed=${current.id}&backgroundColor=ffd700,ffa500` : "")

  const allPhotos = current 
    ? (current.photos || []).filter(Boolean) as string[]
    : []
  if (allPhotos.length === 0 && current) {
    allPhotos.push(avatar)
  }

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activePhotoIndex < allPhotos.length - 1) {
      setActivePhotoIndex(prev => prev + 1)
    }
  }

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activePhotoIndex > 0) {
      setActivePhotoIndex(prev => prev - 1)
    }
  }

  const intentBadges = (profile: Liker): string => {
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
    <div className="flex flex-col h-full overflow-hidden p-6 relative">
      <div className="flex flex-col mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">People Who Liked You</h1>
          <p className="text-sm text-muted-foreground">
            {friendshipLikers.length + datingLikers.length + hookupLikers.length} total pending likes
          </p>
        </div>

        {/* Custom Tab Bar */}
        <div className="flex p-1 bg-muted/40 rounded-xl border border-border/50 backdrop-blur-sm self-start sm:w-auto w-full">
          <button
            onClick={() => { setActiveTab("friendships"); setActivePhotoIndex(0); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "friendships" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Friendships
            {friendshipLikers.length > 0 && (
              <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {friendshipLikers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("dating"); setActivePhotoIndex(0); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "dating" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Dating
            {datingLikers.length > 0 && (
              <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {datingLikers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("hookups"); setActivePhotoIndex(0); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "hookups" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Hookups
            {hookupLikers.length > 0 && (
              <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {hookupLikers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {activeLikers.length > 0 ? (
          <>
            <div className="w-full h-full max-w-5xl flex items-center justify-center gap-4 sm:gap-12 py-2 sm:py-6">
              
              {/* LEFT BUTTON (Pass) */}
              <div className="flex flex-col items-center gap-4 sm:gap-6">
                <button
                  onClick={() => handleSwipe(false)}
                  className="flex h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 items-center justify-center rounded-full border-2 border-destructive text-destructive hover:bg-destructive/10 transition-transform hover:scale-110 active:scale-95"
                  title="Pass"
                >
                  <X className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />
                </button>
              </div>

              {/* CENTER PROFILE (9:16 aspect ratio) */}
              <div
                className={`relative w-full max-w-[360px] sm:max-w-none sm:w-auto h-auto sm:h-full max-h-[85vh] aspect-[9/16] overflow-hidden rounded-2xl bg-muted/30 border-2 shadow-2xl transition-all duration-350 shrink-0 ${
                  current.isSuperLike ? "border-yellow-500/50 shadow-yellow-500/20" : "border-border/50"
                } ${
                  swipingId === current.id
                    ? swipeDirection === "right"
                      ? "animate-swipe-right"
                      : "animate-swipe-left"
                    : "opacity-100 scale-100"
                }`}
              >
                {/* Profile Photo as Background */}
                <div className="absolute inset-0">
                  <img
                    src={allPhotos[activePhotoIndex]}
                    alt={current.real_name}
                    className="w-full h-full object-cover transition-opacity duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80 pointer-events-none" />
                </div>

                {/* Story Indicators */}
                {allPhotos.length > 1 && (
                  <div className="absolute top-2 left-2 right-2 flex gap-1 z-20 pointer-events-none">
                    {allPhotos.map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full bg-white/30 overflow-hidden`}>
                        <div className={`h-full bg-white transition-all duration-300 ${i <= activePhotoIndex ? 'w-full' : 'w-0'}`} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Navigation tap targets */}
                {allPhotos.length > 1 && (
                  <div className="absolute inset-0 flex z-10 pt-10 pb-40">
                    <div className="flex-1 cursor-pointer" onClick={handlePrevPhoto} />
                    <div className="flex-1 cursor-pointer" onClick={handleNextPhoto} />
                  </div>
                )}

                {/* Badges top left */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
                  {current.isSuperLike && (
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-yellow-500 text-yellow-950 shadow-lg rounded-full px-3 py-1 pointer-events-auto w-max">
                      <Star className="h-3.5 w-3.5 fill-yellow-950" /> Super Liked You
                    </span>
                  )}
                  <span className="text-xs font-semibold bg-background/80 text-foreground backdrop-blur-md rounded-full px-3 py-1 pointer-events-auto w-max">
                    {intentBadges(current)}
                  </span>
                </div>

                {/* Info Bottom */}
                <div className="absolute bottom-0 inset-x-0 p-6 z-10 text-white pointer-events-none flex flex-col gap-2">
                  <div className="flex items-end gap-3">
                    <img 
                       src={avatar} 
                       className="w-14 h-14 rounded-full object-cover bg-muted/50 shadow-md"
                       alt={`${current.username} avatar`}
                    />
                    <div className="flex flex-col gap-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold leading-none shadow-black drop-shadow-md">{current.real_name}</h2>
                      </div>
                      <p className="text-sm text-white/90 shadow-black drop-shadow-md font-medium">
                        @{current.username} · {current.department} · {current.year} Year
                      </p>
                    </div>
                  </div>

                  {current.bio && (
                    <p className="text-sm text-white/95 line-clamp-3 shadow-black drop-shadow-md">{current.bio}</p>
                  )}

                  {current.interest_tags && current.interest_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {current.interest_tags.slice(0, 5).map(tag => (
                        <span key={tag} className="text-xs bg-black/40 border border-white/20 rounded-full px-2.5 py-1 font-medium backdrop-blur-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT BUTTON (Like Back) */}
              <div className="flex flex-col items-center gap-4 sm:gap-6">
                <button
                  onClick={() => handleSwipe(true)}
                  className="flex h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-110 active:scale-95 shadow-xl shadow-primary/20"
                  title="Like Back"
                >
                  <Heart className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />
                </button>
              </div>

            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-4">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-primary/40" />
            </div>
            <h3 className="text-lg font-bold">You're all caught up here!</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              No pending {activeTab} likes. Check the other tabs or keep swiping on Discover.
            </p>
            <Button className="mt-5 rounded-xl" onClick={() => router.push("/discover")}>
              Go to Discover
            </Button>
          </div>
        )}
      </div>

      {/* ── MATCH MODAL ── */}
      {matchModal.open && matchModal.matchedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="animate-match-pop w-full max-w-sm overflow-hidden bg-background border border-border rounded-xl">
            {/* Gradient header */}
            <div className="relative bg-gradient-to-br from-primary/25 via-secondary/15 to-primary/10 p-8 pb-4 flex flex-col items-center">
              {/* Pulse ring */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-primary relative z-10">
                  <img
                    src={matchModal.matchedUser.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${matchModal.matchedUser.id}`}
                    alt={matchModal.matchedUser.real_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold tracking-tight">It's a Match!</p>
              <p className="text-sm text-muted-foreground mt-1">
                You matched with <span className="font-semibold text-foreground">{matchModal.matchedUser.real_name}</span>!
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
                Keep Reviewing Likes
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
