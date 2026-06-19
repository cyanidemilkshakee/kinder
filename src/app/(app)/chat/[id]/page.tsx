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

  const router = useRouter()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let channel: any
    let isMounted = true

    const init = async () => {
      const user = await setupChat()
      if (!user || !isMounted) return

      // Subscribe to new messages
      channel = supabase
        .channel(`chat-${chatId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${chatId}`
          },
          (payload) => {
            setMessages((prev) => {
              if (prev.some(m => m.id === payload.new.id)) return prev
              return [...prev, payload.new as Message]
            })
            setTimeout(scrollToBottom, 50)

            // If we receive a message from the other person while in this chat, mark it as read immediately
            if (payload.new.sender_id !== user.id) {
              supabase
                .from("messages")
                .update({ is_read: true })
                .eq("id", payload.new.id)
                .then()
            }
          }
        )
        .subscribe()
    }

    init()

    return () => {
      isMounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [chatId])

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

  async function setupChat() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/"); return null }
    setCurrentUserId(user.id)

    // Fetch match info to get other user's name
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .select(`
        user1:profiles!user1_id(id, username, real_name, department, year, gender, bio, relationship_intent, relationship_intents, avatar_url, photos, interest_tags, food_preference, drinking_habit, smoking_habit),
        user2:profiles!user2_id(id, username, real_name, department, year, gender, bio, relationship_intent, relationship_intents, avatar_url, photos, interest_tags, food_preference, drinking_habit, smoking_habit)
      `)
      .eq("id", chatId)
      .single()

    if (matchError || !matchData) {
      router.push("/chat")
      return
    }

    const user1 = Array.isArray(matchData.user1) ? matchData.user1[0] : (matchData.user1 as any)
    const user2 = Array.isArray(matchData.user2) ? matchData.user2[0] : (matchData.user2 as any)
    const otherUser = user1.id === user.id ? user2 : user1
    setOtherUserName(otherUser.real_name)
    setOtherUserAvatar(otherUser.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${otherUser.id}`)
    setOtherUserProfile(otherUser)

    // Fetch previous messages
    const { data: messageData } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", chatId)
      .order("created_at", { ascending: true })

    if (messageData) {
      setMessages(messageData)
      setTimeout(scrollToBottom, 100)

      // Mark unread messages as read
      const hasUnread = messageData.some((m: any) => m.sender_id !== user.id && !m.is_read)
      if (hasUnread) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("match_id", chatId)
          .neq("sender_id", user.id)
          .eq("is_read", false)
      }
    }
    setLoading(false)
    return user
  }

  const sendContent = async (content: string) => {
    if (!content || !currentUserId) return

    // Optimistic insert
    const tempId = `temp-${Date.now()}`
    const tempMsg: Message = {
      id: tempId,
      content,
      sender_id: currentUserId,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])
    setTimeout(scrollToBottom, 50)

    const { data, error } = await supabase.from("messages").insert({
      match_id: chatId,
      sender_id: currentUserId,
      content: content
    }).select().single()

    if (error) {
      // Remove temp message if failed
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } else if (data) {
      // Replace temp message with real one
      setMessages(prev => prev.map(m => m.id === tempId ? data : m))
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    const content = newMessage.trim()
    setNewMessage("")
    await sendContent(content)
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
            <p className="text-xs text-muted-foreground">Matched</p>
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
        <form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
      </div>
    {profileModalOpen && otherUserProfile && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-lg">
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
