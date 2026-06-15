"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Heart, Loader2, MessageCircle, Check } from "lucide-react"

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

  const fetchLikers = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/"); return }

    // Get all right-swipes ON the current user
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

    // Fetch their profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, real_name, department, year, gender, avatar_url, interest_tags")
      .in("id", likerIds)
      .eq("is_visible", true)

    if (!profiles) { setLikers([]); setLoading(false); return }

    // Get existing matches
    const { data: matches } = await supabase
      .from("matches")
      .select("id, user1_id, user2_id")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    const matchMap = new Map<string, string>()
    matches?.forEach(m => {
      const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id
      matchMap.set(otherId, m.id)
    })

    const enriched: Liker[] = profiles.map(p => ({
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

    // Record the swipe back
    await supabase.from("swipes").upsert({
      swiper_id: user.id,
      swiped_id: liker.id,
      is_right_swipe: true,
    })

    // Create the match
    const user1_id = user.id < liker.id ? user.id : liker.id
    const user2_id = user.id < liker.id ? liker.id : user.id
    const { data: match } = await supabase
      .from("matches")
      .insert({ user1_id, user2_id })
      .select("id")
      .single()

    setMatchingId(null)

    if (match) {
      setLikers(prev => prev.map(l =>
        l.id === liker.id ? { ...l, isMatched: true, matchId: match.id } : l
      ))
      showToast(`Matched with ${liker.real_name}! 🎉`, "success")
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-card/80 border-b border-border px-6 py-5 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Heart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">People Who Liked You</h2>
          <p className="text-sm text-muted-foreground">
            {likers.length} {likers.length === 1 ? "person" : "people"} liked your profile
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {likers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <Heart className="h-10 w-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No likes yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              Keep swiping on Discover — when someone likes you back, they'll appear here.
            </p>
            <Button className="mt-5 rounded-xl" onClick={() => router.push("/discover")}>
              Go to Discover
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {likers.map(liker => {
              const avatar = liker.avatar_url
                || `https://api.dicebear.com/9.x/micah/svg?seed=${liker.id}&backgroundColor=ffd700`

              return (
                <div
                  key={liker.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-primary/20 group"
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
                          <span key={tag} className="text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
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
                          className="flex-1 rounded-xl text-xs h-9 gap-1.5 bg-primary/90 hover:bg-primary"
                          onClick={() => handleMatchBack(liker)}
                          disabled={matchingId === liker.id}
                        >
                          {matchingId === liker.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <><Heart className="h-3.5 w-3.5" /> Like Back</>
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
