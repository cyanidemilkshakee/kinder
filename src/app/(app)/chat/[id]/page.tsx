/* eslint-disable */
"use client"

import { use, useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Send, Loader2, X } from "lucide-react"
import { ProfilePostCard, type PostProfile } from "@/components/ProfilePostCard"

type Message = {
  id: string
  content: string
  sender_id: string
  created_at: string
  is_read?: boolean
}

type RealtimeStatus = "connecting" | "live" | "offline"

function mergeMessages(current: Message[], incoming: Message[]) {
  const messagesById = new Map(current.map((message) => [message.id, message]))

  for (const message of incoming) {
    messagesById.set(message.id, message)
  }

  return Array.from(messagesById.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const chatId = resolvedParams.id

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [otherUserName, setOtherUserName] = useState("...")
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null)
  const [otherUserProfile, setOtherUserProfile] = useState<PostProfile | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("connecting")
  const [sendError, setSendError] = useState<string | null>(null)

  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let isMounted = true

    const markMessageRead = async (messageId: string) => {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId)
    }

    const loadMessages = async (userId: string) => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, content, sender_id, created_at, is_read")
        .eq("match_id", chatId)
        .order("created_at", { ascending: true })

      if (!isMounted || error || !data) return

      setMessages((current) => mergeMessages(current, data as Message[]))

      const hasUnread = data.some(
        (message) => message.sender_id !== userId && !message.is_read
      )

      if (hasUnread) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("match_id", chatId)
          .neq("sender_id", userId)
          .eq("is_read", false)
      }
    }

    const init = async () => {
      setLoading(true)
      setRealtimeStatus("connecting")

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/")
        return
      }

      if (!isMounted) return
      setCurrentUserId(user.id)

      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select(`
          user1:profiles!user1_id(id, username, real_name, department, year, gender, bio, relationship_intent, relationship_intents, avatar_url, photos, interest_tags, food_preference, drinking_habit, smoking_habit),
          user2:profiles!user2_id(id, username, real_name, department, year, gender, bio, relationship_intent, relationship_intents, avatar_url, photos, interest_tags, food_preference, drinking_habit, smoking_habit)
        `)
        .eq("id", chatId)
        .single()

      if (!isMounted) return

      if (matchError || !matchData) {
        router.push("/chat")
        return
      }

      const user1 = Array.isArray(matchData.user1) ? matchData.user1[0] : matchData.user1
      const user2 = Array.isArray(matchData.user2) ? matchData.user2[0] : matchData.user2
      const otherUser = user1?.id === user.id ? user2 : user1

      if (!otherUser) {
        router.push("/chat")
        return
      }

      setOtherUserName(otherUser.real_name)
      setOtherUserAvatar(
        otherUser.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${otherUser.id}`
      )
      setOtherUserProfile(otherUser as PostProfile)

      channel = supabase
        .channel(`chat-${chatId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `match_id=eq.${chatId}`,
          },
          (payload) => {
            const incomingMessage = payload.new as Message
            setMessages((current) => mergeMessages(current, [incomingMessage]))

            if (incomingMessage.sender_id !== user.id) {
              void markMessageRead(incomingMessage.id)
            }
          }
        )
        .subscribe((status) => {
          if (!isMounted) return

          if (status === "SUBSCRIBED") {
            setRealtimeStatus("live")
            // Catch up once the socket is live so no startup message can be missed.
            void loadMessages(user.id)
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            setRealtimeStatus("offline")
          }
        })

      await loadMessages(user.id)
      if (isMounted) setLoading(false)
    }

    void init()

    return () => {
      isMounted = false
      if (channel) void supabase.removeChannel(channel)
    }
  }, [chatId, router, supabase])

  useEffect(() => {
    if (messages.length === 0) return
    const frame = requestAnimationFrame(scrollToBottom)
    return () => cancelAnimationFrame(frame)
  }, [messages.length])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleNextPhoto = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (!otherUserProfile) return
    const allPhotos = otherUserProfile.photos?.filter(Boolean) || []
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

  const sendContent = async (content: string) => {
    if (!content || !currentUserId) return false

    setSendError(null)

    // Optimistic insert
    const tempId = `temp-${crypto.randomUUID()}`
    const tempMsg: Message = {
      id: tempId,
      content,
      sender_id: currentUserId,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])

    const { data, error } = await supabase.from("messages").insert({
      match_id: chatId,
      sender_id: currentUserId,
      content: content
    }).select().single()

    if (error) {
      // Remove temp message if failed
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setSendError("Message wasn't sent. Please try again.")
      return false
    } else if (data) {
      // Realtime may arrive before the insert response, so merge the saved row.
      setMessages((current) =>
        mergeMessages(current.filter((message) => message.id !== tempId), [data as Message])
      )
    }

    return true
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    const content = newMessage.trim()
    setNewMessage("")
    const sent = await sendContent(content)
    if (!sent) setNewMessage((current) => current || content)
  }

  const ICEBREAKERS = [
    "What's the best class you're taking this semester?",
    "If you could teleport anywhere on campus right now, where would it be?",
    "Late night study session or early morning grind?",
    "What's your go-to spot for food around college?"
  ]

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-transparent">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent">
      {/* Header */}
      <div 
        onClick={() => setProfileModalOpen(true)}
        className="bg-background/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center gap-4 sticky top-0 z-10 cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-border flex-shrink-0">
            <img src={otherUserAvatar!} alt={otherUserName} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-base font-bold">{otherUserName}</h1>
            <p className="text-xs text-muted-foreground">
              {realtimeStatus === "live"
                ? "Live chat"
                : realtimeStatus === "connecting"
                  ? "Connecting..."
                  : "Reconnecting..."}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-sm font-medium text-foreground">Say hi to {otherUserName}!</p>
            <p className="text-xs mt-1 mb-6 max-w-xs">Send an icebreaker to start the conversation or type your own.</p>
            
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {ICEBREAKERS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendContent(prompt)}
                  className="text-xs text-left px-4 py-3 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-colors shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUserId
            const prevMsg = index > 0 ? messages[index - 1] : null
            const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id)
            const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                <div className={`flex max-w-[75%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Other user avatar (only shown on first msg in a group) */}
                  {!isMe && (
                    <div className="w-8 flex-shrink-0 flex items-end pb-1">
                      {showAvatar && (
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-border">
                          <img src={otherUserAvatar!} alt={otherUserName} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`px-4 py-2 text-sm shadow-sm ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' 
                          : 'bg-background border border-border text-foreground rounded-2xl rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {timeStr}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-background/90 backdrop-blur-md border-t border-border p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                if (sendError) setSendError(null)
              }}
              placeholder={`Message ${otherUserName}...`}
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
              autoComplete="off"
            />
            <Button
              type="submit"
              className="rounded-xl px-4 flex-shrink-0"
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          {sendError && (
            <p role="alert" className="mt-2 text-xs font-semibold text-destructive">
              {sendError}
            </p>
          )}
        </div>
      </div>
    {profileModalOpen && otherUserProfile && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-4xl xl:max-w-5xl">
          <button
            onClick={() => setProfileModalOpen(false)}
            className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-background/20 text-white hover:bg-background/40"
          >
            <X className="h-6 w-6" />
          </button>
          <ProfilePostCard
            profile={otherUserProfile}
            avatarUrl={otherUserAvatar!}
            photos={otherUserProfile.photos?.filter(Boolean) as string[] || []}
            activePhotoIndex={activePhotoIndex}
            onPrevPhoto={handlePrevPhoto}
            onNextPhoto={handleNextPhoto}
          />
        </div>
      </div>
    )}
    </div>
  )
}
