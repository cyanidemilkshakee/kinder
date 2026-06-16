/* eslint-disable */
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Heart, Loader2, MessageCircle, Check, Sparkles } from "lucide-react"

type Liker = {
  id: string
  real_name: string
  department: string
  year: string
  gender: string
  avatar_url: string | null
  interest_tags: string[] | null
  isMatched: boolean
  matchId: string | null
}

export default function LikesPage() {
  const [likers, setLikers] = useState<Liker[]>([])
  const [loading, setLoading] = useState(true)
  const [matchingId, setMatchingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    fetchLikers()
  }, [])

  async function fetchLikers() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/"); return }

    // Step 1: get right-swipes on me
    const { data: rightSwipes } = await supabase
      .from("swipes")
      .select("swiper_id")
      .eq("swiped_id", user.id)
      .eq("is_right_swipe", true)

    if (!rightSwipes || rightSwipes.length === 0) {
      setLikers([])
      setLoading(false)
      return
    }

    const likerIds = rightSwipes.map(s => s.swiper_id)

    // Step 2: fetch profiles + matches in PARALLEL
    const [profilesRes, matchesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, real_name, department, year, gender, avatar_url, interest_tags")
        .in("id", likerIds)
        .eq("is_visible", true),
      supabase
        .from("matches")
        .select("id, user1_id, user2_id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
    ])

    const profiles = profilesRes.data
    if (!profiles) { setLikers([]); setLoading(false); return }

    const matchMap = new Map<string, string>()
    matchesRes.data?.forEach((m: any) => {
      const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id
      matchMap.set(otherId, m.id)
    })

    const enriched: Liker[] = profiles.map((p: any) => ({
      ...p,
      interest_tags: p.interest_tags || [],
      isMatched: matchMap.has(p.id),
      matchId: matchMap.get(p.id) || null,
    }))

    setLikers(enriched)
    setLoading(false)
  }

  const handleMatchBack = async (liker: Liker) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setMatchingId(liker.id)

    // Record swipe + create match in parallel
    const user1_id = user.id < liker.id ? user.id : liker.id
    const user2_id = user.id < liker.id ? liker.id : user.id

    const [, matchRes] = await Promise.all([
      supabase.from("swipes").upsert({
        swiper_id: user.id,
        swiped_id: liker.id,
        is_right_swipe: true,
      }),
      supabase
        .from("matches")
        .insert({ user1_id, user2_id })
        .select("id")
        .single(),
    ])

    setMatchingId(null)

    if (matchRes.data) {
      setLikers(prev => prev.map(l =>
        l.id === liker.id ? { ...l, isMatched: true, matchId: matchRes.data!.id } : l
      ))
      showToast(`Matched with ${liker.real_name}! 🎉`, "success")
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center">
              <Heart className="h-8 w-8 text-primary/40" />
            </div>
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading your likes…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="w-full px-6 pt-6">

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">People Who Liked You</h1>
            <p className="text-sm text-muted-foreground">
              {likers.length} {likers.length === 1 ? "person" : "people"} liked your profile
            </p>
          </div>
        </div>

        {/* Content Box */}
        <div className="w-full rounded-2xl border border-border overflow-hidden">

          {likers.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 px-8">
              <div className="h-20 w-20 rounded-full flex items-center justify-center mb-5">
                <Heart className="h-10 w-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold text-foreground">No likes yet</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
                Keep swiping on Discover — when someone likes you, they'll appear here.
              </p>
              <Button
                className="mt-6 rounded-xl px-8"
                onClick={() => router.push("/discover")}
              >
                Go to Discover
              </Button>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {likers.map(liker => {
                const avatar = liker.avatar_url
                  || `https://api.dicebear.com/9.x/micah/svg?seed=${liker.id}&backgroundColor=6f42c1`

                return (
                  <div
                    key={liker.id}
                    className="bg-background border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-200 group"
                  >
                    {/* Avatar */}
                    <div className="relative h-44 bg-gradient-to-br from-primary/10 to-secondary/10">
                      <img src={avatar} alt={liker.real_name} className="w-full h-full object-cover" />
                      {liker.isMatched && (
                        <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Check className="h-3 w-3" /> Matched
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-base">{liker.real_name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {liker.department} · {liker.year} Year
                      </p>

                      {liker.interest_tags && liker.interest_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {liker.interest_tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        {liker.isMatched ? (
                          <Button
                            className="flex-1 rounded-xl text-xs h-9 gap-1.5"
                            onClick={() => liker.matchId && router.push(`/chat/${liker.matchId}`)}
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> Chat
                          </Button>
                        ) : (
                          <Button
                            className="flex-1 rounded-xl text-xs h-9 gap-1.5"
                            onClick={() => handleMatchBack(liker)}
                            disabled={matchingId === liker.id}
                          >
                            {matchingId === liker.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <><Sparkles className="h-3.5 w-3.5" /> Like Back</>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast px-5 py-3 rounded-2xl shadow-xl text-sm font-medium ${
          toast.type === "success" ? "bg-primary text-primary-foreground" : "bg-destructive text-white"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
