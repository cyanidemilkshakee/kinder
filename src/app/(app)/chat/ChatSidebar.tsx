/* eslint-disable */
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

type Match = {
  id: string
  other_user: {
    id: string
    real_name: string
    avatar_url: string | null
  }
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  muted: boolean
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function ChatSidebar() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    fetchMatches(true)

    // Subscribe to new messages and updates to update last message preview and read status
    const channel = supabase
      .channel("chat-sidebar-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        fetchMatches()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
        fetchMatches()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "muted_matches" }, () => {
        fetchMatches()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchMatches(showLoading = false) {
    if (showLoading) setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: matchData, error }, { data: mutedRows }] = await Promise.all([
      supabase
        .from("matches")
        .select(`
          id,
          created_at,
          user1:profiles!user1_id(id, real_name, avatar_url),
          user2:profiles!user2_id(id, real_name, avatar_url)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("created_at", { ascending: false }),
      supabase.from("muted_matches").select("match_id").eq("user_id", user.id),
    ])
    const mutedIds = new Set((mutedRows || []).map((row) => row.match_id))

    if (!error && matchData) {
      // Fetch last message for each match
      const enriched: Match[] = await Promise.all(
        matchData.map(async (m: any) => {
          const otherUser = m.user1.id === user.id ? m.user2 : m.user1

          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at, deleted_at, message_type")
            .eq("match_id", m.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()

          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("match_id", m.id)
            .eq("is_read", false)
            .neq("sender_id", user.id)

          return {
            id: m.id,
            other_user: otherUser,
            last_message: lastMsg?.deleted_at
              ? "Message deleted"
              : lastMsg?.content || (lastMsg?.message_type && lastMsg.message_type !== "text" ? `Shared ${lastMsg.message_type}` : null),
            last_message_at: lastMsg?.created_at || null,
            unread_count: unreadCount || 0,
            muted: mutedIds.has(m.id),
          }
        })
      )

      // Sort by last message time
      enriched.sort((a, b) => {
        if (!a.last_message_at && !b.last_message_at) return 0
        if (!a.last_message_at) return 1
        if (!b.last_message_at) return -1
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      })

      setMatches(enriched)
    }
    setLoading(false)
  }

  return (
    <div className={`${pathname.startsWith("/chat/") ? "hidden md:flex" : "flex"} h-full w-full flex-shrink-0 flex-col border-r border-border bg-transparent md:w-72`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-lg uppercase">Messages</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{matches.length} active match{matches.length !== 1 ? "es" : ""}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : matches.length > 0 ? (
          <div>
            {matches.map((match) => {
              const isActive = pathname === `/chat/${match.id}`
              const avatar = match.other_user.avatar_url
                || `https://api.dicebear.com/9.x/micah/svg?seed=${match.other_user.id}&backgroundColor=ffd700`

              return (
                <button
                  key={match.id}
                  className={`w-full p-4 flex items-center gap-3 transition-all text-left border-b border-border/50 hover:bg-muted/40 ${
                    isActive ? "bg-primary/10 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"
                  }`}
                  onClick={() => router.push(`/chat/${match.id}`)}
                >
                  <div className="h-11 w-11 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0">
                    <img src={avatar} alt={match.other_user.real_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className={`text-sm truncate ${match.unread_count > 0 ? "font-bold text-foreground" : "font-semibold"}`}>
                        {match.other_user.real_name}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {match.unread_count > 0 && (
                          <span className="inline-flex items-center justify-center rounded-full bg-red-500 min-w-4 h-4 px-1 text-[10px] font-bold text-white leading-none">
                            {match.unread_count}
                          </span>
                        )}
                        {match.muted && (
                          <span className="text-[10px] text-muted-foreground">Muted</span>
                        )}
                        {match.last_message_at && (
                          <span className={`text-xs ${match.unread_count > 0 ? "text-primary font-medium" : "text-muted-foreground"}`}>
                            {timeAgo(match.last_message_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${match.unread_count > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {match.last_message || "Tap to start chatting"}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <p className="text-sm text-muted-foreground">No matches yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Swipe on Discover to connect!</p>
          </div>
        )}
      </div>
    </div>
  )
}
