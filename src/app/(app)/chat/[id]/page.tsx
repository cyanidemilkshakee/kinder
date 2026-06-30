/* eslint-disable @next/next/no-img-element */
"use client"

import { Fragment, use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, Unlink, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MotionModal } from "@/components/MotionModal"
import { ProfilePostCard, type PostProfile } from "@/components/ProfilePostCard"
import { createClient } from "@/lib/client"
import { ChatComposer } from "./ChatComposer"
import { MessageBubble } from "./MessageBubble"
import {
  MESSAGE_SELECT,
  buildConversationStarters,
  formatLastSeen,
  formatMessageDate,
  mergeMessages,
  sameCalendarDay,
  type MediaMetadata,
  type Message,
  type MessageReaction,
  type MessageType,
} from "../chat-types"

const PAGE_SIZE = 30
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 25 * 1024 * 1024
const MAX_AUDIO_SIZE = 15 * 1024 * 1024

type RealtimeStatus = "connecting" | "live" | "offline"
type ChatProfile = PostProfile & {
  last_seen_at?: string | null
  read_receipts_enabled?: boolean
}

function mergeReactions(current: MessageReaction[], incoming: MessageReaction[]) {
  const byId = new Map(current.map((reaction) => [reaction.id, reaction]))
  for (const reaction of incoming) byId.set(reaction.id, reaction)
  return Array.from(byId.values())
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: chatId } = use(params)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [messages, setMessages] = useState<Message[]>([])
  const [reactions, setReactions] = useState<MessageReaction[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<ChatProfile | null>(null)
  const [otherUserProfile, setOtherUserProfile] = useState<ChatProfile | null>(null)
  const [otherUserAvatar, setOtherUserAvatar] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [composerBusy, setComposerBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("connecting")
  const [otherUserOnline, setOtherUserOnline] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const [endConversationOpen, setEndConversationOpen] = useState(false)
  const [safetyBusy, setSafetyBusy] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [isBlockedByMe, setIsBlockedByMe] = useState(false)
  const [isBlockedByThem, setIsBlockedByThem] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingVisibleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldScrollToBottomRef = useRef(true)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingStartedAtRef = useRef(0)
  const recordingCancelledRef = useRef(false)

  const otherUserName = otherUserProfile?.real_name || "..."
  const conversationStarters = useMemo(
    () => buildConversationStarters(currentUserProfile, otherUserProfile),
    [currentUserProfile, otherUserProfile]
  )
  const messagesById = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages]
  )

  const hydrateMedia = useCallback(async (rows: Message[]) => {
    const paths = Array.from(new Set(rows.flatMap((message) => message.media_path ? [message.media_path] : [])))
    if (paths.length === 0) return rows

    const { data } = await supabase.storage.from("chat-media").createSignedUrls(paths, 60 * 60)
    const urls = new Map((data || []).map((item) => [item.path, item.signedUrl]))

    return rows.map((message) => ({
      ...message,
      media_url: message.media_path ? urls.get(message.media_path) || null : null,
    }))
  }, [supabase])

  const loadReactions = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return
    const { data } = await supabase
      .from("message_reactions")
      .select("id, message_id, match_id, user_id, emoji, created_at")
      .in("message_id", messageIds)

    if (data) setReactions((current) => mergeReactions(current, data as MessageReaction[]))
  }, [supabase])

  const loadLatestMessages = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("messages")
      .select(MESSAGE_SELECT)
      .eq("match_id", chatId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE)

    if (loadError || !data) return
    const rows = await hydrateMedia((data as unknown as Message[]).reverse())
    setMessages((current) => mergeMessages(current, rows))
    setHasMore(data.length === PAGE_SIZE)
    await loadReactions(rows.map((message) => message.id))
  }, [chatId, hydrateMedia, loadReactions, supabase])

  const markReceivedMessages = useCallback(async (userId: string, readReceiptsEnabled: boolean) => {
    const now = new Date().toISOString()
    const updates: Record<string, boolean | string> = {
      is_read: true,
      delivered_at: now,
    }
    if (readReceiptsEnabled) updates.read_at = now

    await supabase
      .from("messages")
      .update(updates)
      .eq("match_id", chatId)
      .neq("sender_id", userId)
      .eq("is_read", false)
  }, [chatId, supabase])

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      setLoading(true)
      setRealtimeStatus("connecting")

      const [{ data: authData }, { data: sessionData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ])
      const user = authData.user
      if (!user) {
        router.push("/")
        return
      }
      if (!mounted) return

      setCurrentUserId(user.id)
      if (sessionData.session?.access_token) {
        supabase.realtime.setAuth(sessionData.session.access_token)
      }

      const [{ data: matchData, error: matchError }, { data: muteData }] = await Promise.all([
        supabase
          .from("matches")
          .select(`
            id,
            user1_id,
            user2_id,
            user1:profiles!user1_id(id, username, real_name, department, year, gender, bio, relationship_intent, relationship_intents, avatar_url, photos, interest_tags, food_preference, drinking_habit, smoking_habit, last_seen_at, read_receipts_enabled),
            user2:profiles!user2_id(id, username, real_name, department, year, gender, bio, relationship_intent, relationship_intents, avatar_url, photos, interest_tags, food_preference, drinking_habit, smoking_habit, last_seen_at, read_receipts_enabled)
          `)
          .eq("id", chatId)
          .single(),
        supabase
          .from("muted_matches")
          .select("id")
          .eq("match_id", chatId)
          .eq("user_id", user.id)
          .maybeSingle(),
      ])

      if (!mounted) return
      if (matchError || !matchData) {
        router.push("/chat")
        return
      }

      const user1 = Array.isArray(matchData.user1) ? matchData.user1[0] : matchData.user1
      const user2 = Array.isArray(matchData.user2) ? matchData.user2[0] : matchData.user2
      const me = (user1?.id === user.id ? user1 : user2) as ChatProfile | undefined
      const other = (user1?.id === user.id ? user2 : user1) as ChatProfile | undefined
      if (!me || !other) {
        router.push("/chat")
        return
      }

      const { data: blockData } = await supabase
        .from("blocks")
        .select("blocker_id, blocked_id")
        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${other.id}),and(blocker_id.eq.${other.id},blocked_id.eq.${user.id})`)

      if (blockData) {
        setIsBlockedByMe(blockData.some((b) => b.blocker_id === user.id))
        setIsBlockedByThem(blockData.some((b) => b.blocker_id === other.id))
      }

      setCurrentUserProfile(me)
      setOtherUserProfile(other)
      setLastSeenAt(other.last_seen_at || null)
      setOtherUserAvatar(
        other.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${other.id}`
      )
      setMuted(Boolean(muteData))

      await Promise.all([
        loadLatestMessages(),
        markReceivedMessages(user.id, me.read_receipts_enabled !== false),
      ])

      const channel = supabase
        .channel(`match:${chatId}`, {
          config: {
            private: true,
            presence: { key: user.id },
          },
        })
        .on("presence", { event: "sync" }, () => {
          const presences = Object.values(channel.presenceState()).flat() as Array<{ user_id?: string }>
          setOtherUserOnline(presences.some((presence) => presence.user_id === other.id))
        })
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload.user_id !== other.id) return
          setOtherUserTyping(Boolean(payload.is_typing))
          if (typingVisibleTimerRef.current) clearTimeout(typingVisibleTimerRef.current)
          if (payload.is_typing) {
            typingVisibleTimerRef.current = setTimeout(() => setOtherUserTyping(false), 1800)
          }
        })
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${chatId}` },
          (payload) => {
            const incoming = payload.new as Message
            void hydrateMedia([incoming]).then((hydrated) => {
              setMessages((current) => mergeMessages(current, hydrated))
            })
            shouldScrollToBottomRef.current = true

            if (incoming.sender_id !== user.id) {
              void markReceivedMessages(user.id, me.read_receipts_enabled !== false)
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "messages", filter: `match_id=eq.${chatId}` },
          (payload) => setMessages((current) => mergeMessages(current, [payload.new as Message]))
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "message_reactions", filter: `match_id=eq.${chatId}` },
          (payload) => setReactions((current) => mergeReactions(current, [payload.new as MessageReaction]))
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "message_reactions", filter: `match_id=eq.${chatId}` },
          (payload) => setReactions((current) => mergeReactions(current, [payload.new as MessageReaction]))
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "message_reactions" },
          (payload) => {
            const deletedId = (payload.old as { id?: string }).id
            if (deletedId) setReactions((current) => current.filter((reaction) => reaction.id !== deletedId))
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${other.id}` },
          (payload) => setLastSeenAt((payload.new as { last_seen_at?: string }).last_seen_at || null)
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "matches" },
          (payload) => {
            if ((payload.old as { id?: string }).id === chatId) router.push("/chat")
          }
        )
        .subscribe(async (status) => {
          if (!mounted) return
          if (status === "SUBSCRIBED") {
            setRealtimeStatus("live")
            await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
            await loadLatestMessages()
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setRealtimeStatus("offline")
          }
        })

      channelRef.current = channel
      if (mounted) setLoading(false)
    }

    void initialize()

    return () => {
      mounted = false
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      if (typingVisibleTimerRef.current) clearTimeout(typingVisibleTimerRef.current)
      const channel = channelRef.current
      channelRef.current = null
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      if (channel) {
        void channel.untrack()
        void supabase.removeChannel(channel)
      }
    }
  }, [chatId, hydrateMedia, loadLatestMessages, markReceivedMessages, router, supabase])

  useEffect(() => {
    if (!shouldScrollToBottomRef.current || messages.length === 0) return
    shouldScrollToBottomRef.current = false
    const frame = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    })
    return () => cancelAnimationFrame(frame)
  }, [messages.length])

  useEffect(() => {
    if (!endConversationOpen && !profileModalOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEndConversationOpen(false)
        setProfileModalOpen(false)
      }
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [endConversationOpen, profileModalOpen])

  useEffect(() => {
    if (!recording) return
    const timer = setInterval(() => {
      setRecordingSeconds(Math.floor((Date.now() - recordingStartedAtRef.current) / 1000))
    }, 500)
    return () => clearInterval(timer)
  }, [recording])

  const loadOlderMessages = async () => {
    if (!hasMore || loadingMore || messages.length === 0) return
    const container = scrollContainerRef.current
    const previousHeight = container?.scrollHeight || 0
    setLoadingMore(true)

    const { data, error: loadError } = await supabase
      .from("messages")
      .select(MESSAGE_SELECT)
      .eq("match_id", chatId)
      .lt("created_at", messages[0].created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE)

    if (!loadError && data) {
      const rows = await hydrateMedia((data as unknown as Message[]).reverse())
      setMessages((current) => mergeMessages(current, rows))
      setHasMore(data.length === PAGE_SIZE)
      await loadReactions(rows.map((message) => message.id))

      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - previousHeight
      })
    }

    setLoadingMore(false)
  }

  const sendTyping = (isTyping: boolean) => {
    const channel = channelRef.current
    if (!channel || !currentUserId || realtimeStatus !== "live") return
    void channel.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: currentUserId, is_typing: isTyping },
    })
  }

  const updateComposer = (value: string) => {
    setNewMessage(value)
    setError(null)
    sendTyping(Boolean(value.trim()))
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => sendTyping(false), 1200)
  }

  const insertMessage = async (
    payload: Partial<Message> & Pick<Message, "content" | "message_type">
  ) => {
    if (!currentUserId) return false
    setComposerBusy(true)
    setError(null)

    const temporary: Message = {
      id: `temp-${crypto.randomUUID()}`,
      match_id: chatId,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      is_read: false,
      edited_at: null,
      deleted_at: null,
      reply_to_id: payload.reply_to_id || null,
      media_path: payload.media_path || null,
      media_metadata: payload.media_metadata || {},
      delivered_at: null,
      read_at: null,
      media_url: payload.media_url || null,
      content: payload.content,
      message_type: payload.message_type,
    }

    shouldScrollToBottomRef.current = true
    setMessages((current) => mergeMessages(current, [temporary]))

    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({
        match_id: chatId,
        sender_id: currentUserId,
        content: payload.content,
        message_type: payload.message_type,
        media_path: payload.media_path || null,
        media_metadata: payload.media_metadata || {},
        reply_to_id: payload.reply_to_id || null,
      })
      .select(MESSAGE_SELECT)
      .single()

    if (insertError || !data) {
      setMessages((current) => current.filter((message) => message.id !== temporary.id))
      setError("Message wasn't sent. Please try again.")
      setComposerBusy(false)
      return false
    }

    const saved = { ...(data as unknown as Message), media_url: payload.media_url || null }
    setMessages((current) => mergeMessages(
      current.filter((message) => message.id !== temporary.id),
      [saved]
    ))
    setReplyTo(null)
    setComposerBusy(false)
    return true
  }

  const sendTextMessage = async () => {
    const content = newMessage.trim()
    if (!content) return
    setNewMessage("")
    sendTyping(false)
    const sent = await insertMessage({
      content,
      message_type: "text",
      reply_to_id: replyTo?.id || null,
    })
    if (!sent) setNewMessage((current) => current || content)
  }

  const uploadMedia = async (
    file: File,
    type: Exclude<MessageType, "text">,
    duration?: number
  ) => {
    if (!currentUserId) return
    const limit = type === "video" ? MAX_VIDEO_SIZE : type === "audio" ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE
    if (file.size > limit) {
      setError(`${type === "video" ? "Videos" : type === "audio" ? "Voice notes" : "Images"} must be under ${Math.round(limit / 1024 / 1024)} MB.`)
      return
    }

    setComposerBusy(true)
    setError(null)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-")
    const path = `${chatId}/${currentUserId}/${crypto.randomUUID()}-${safeName}`
    const { error: uploadError } = await supabase.storage
      .from("chat-media")
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      setError("Media upload failed. Please try again.")
      setComposerBusy(false)
      return
    }

    const { data: signedData } = await supabase.storage
      .from("chat-media")
      .createSignedUrl(path, 60 * 60)
    const metadata: MediaMetadata = { name: file.name, size: file.size }
    if (type === "audio" && duration !== undefined) metadata.duration = duration

    const sent = await insertMessage({
      content: newMessage.trim(),
      message_type: type,
      media_path: path,
      media_url: signedData?.signedUrl || null,
      media_metadata: metadata,
      reply_to_id: replyTo?.id || null,
    })

    if (sent) {
      setNewMessage("")
    } else {
      await supabase.storage.from("chat-media").remove([path])
    }
    setComposerBusy(false)
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording is not supported in this browser.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const preferredType = "audio/webm;codecs=opus"
      const recorder = MediaRecorder.isTypeSupported(preferredType)
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream)

      mediaStreamRef.current = stream
      mediaRecorderRef.current = recorder
      recordingChunksRef.current = []
      recordingCancelledRef.current = false
      recordingStartedAtRef.current = new Date().getTime()
      setRecordingSeconds(0)
      setRecording(true)
      setError(null)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        setRecording(false)
        if (recordingCancelledRef.current) {
          recordingChunksRef.current = []
          return
        }

        const duration = Math.max(1, Math.round((new Date().getTime() - recordingStartedAtRef.current) / 1000))
        const mimeType = recorder.mimeType || "audio/webm"
        const blob = new Blob(recordingChunksRef.current, { type: mimeType })
        const file = new File([blob], `voice-${crypto.randomUUID()}.webm`, { type: mimeType })
        void uploadMedia(file, "audio", duration)
      }
      recorder.start()
    } catch {
      setError("Microphone access is needed to record a voice note.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop()
  }

  const cancelRecording = () => {
    recordingCancelledRef.current = true
    stopRecording()
  }

  const editMessage = async (message: Message, content: string) => {
    const previous = message
    setMessages((current) => mergeMessages(current, [{
      ...message,
      content,
      edited_at: new Date().toISOString(),
    }]))

    const { data, error: editError } = await supabase
      .from("messages")
      .update({ content })
      .eq("id", message.id)
      .eq("sender_id", currentUserId)
      .is("deleted_at", null)
      .select(MESSAGE_SELECT)
      .single()

    if (editError || !data) {
      setMessages((current) => mergeMessages(current, [previous]))
      setError("Message couldn't be edited.")
      return false
    }
    setMessages((current) => mergeMessages(current, [data as unknown as Message]))
    return true
  }

  const deleteMessage = async (message: Message) => {
    const previous = message
    setMessages((current) => mergeMessages(current, [{
      ...message,
      content: "",
      deleted_at: new Date().toISOString(),
      media_path: null,
      media_url: null,
    }]))

    const { data, error: deleteError } = await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", message.id)
      .eq("sender_id", currentUserId)
      .is("deleted_at", null)
      .select(MESSAGE_SELECT)
      .single()

    if (deleteError || !data) {
      setMessages((current) => mergeMessages(current, [previous]))
      setError("Message couldn't be deleted.")
      return false
    }

    setMessages((current) => mergeMessages(current, [data as unknown as Message]))
    setReactions((current) => current.filter((reaction) => reaction.message_id !== message.id))
    if (message.media_path) await supabase.storage.from("chat-media").remove([message.media_path])
    return true
  }

  const reactToMessage = async (message: Message, emoji: string) => {
    if (!currentUserId) return
    const snapshot = reactions
    const existing = reactions.find(
      (reaction) => reaction.message_id === message.id && reaction.user_id === currentUserId
    )

    if (existing?.emoji === emoji) {
      setReactions((current) => current.filter((reaction) => reaction.id !== existing.id))
      const { error: reactionError } = await supabase
        .from("message_reactions")
        .delete()
        .eq("id", existing.id)
      if (reactionError) setReactions(snapshot)
      return
    }

    if (existing) {
      const optimistic = { ...existing, emoji }
      setReactions((current) => mergeReactions(current, [optimistic]))
      const { data, error: reactionError } = await supabase
        .from("message_reactions")
        .update({ emoji })
        .eq("id", existing.id)
        .select("id, message_id, match_id, user_id, emoji, created_at")
        .single()
      if (reactionError || !data) setReactions(snapshot)
      else setReactions((current) => mergeReactions(current, [data as MessageReaction]))
      return
    }

    const optimistic: MessageReaction = {
      id: `temp-${crypto.randomUUID()}`,
      message_id: message.id,
      match_id: chatId,
      user_id: currentUserId,
      emoji,
      created_at: new Date().toISOString(),
    }
    setReactions((current) => mergeReactions(current, [optimistic]))
    const { data, error: reactionError } = await supabase
      .from("message_reactions")
      .insert({ message_id: message.id, match_id: chatId, user_id: currentUserId, emoji })
      .select("id, message_id, match_id, user_id, emoji, created_at")
      .single()
    if (reactionError || !data) setReactions(snapshot)
    else setReactions((current) => mergeReactions(
      current.filter((reaction) => reaction.id !== optimistic.id),
      [data as MessageReaction]
    ))
  }

  const handleBlock = async () => {
    if (!otherUserProfile || !currentUserId) return
    if (!window.confirm(`Are you sure you want to block ${otherUserProfile.real_name}?`)) return
    
    setSafetyBusy(true)
    const { error } = await supabase.from("blocks").insert({
      blocker_id: currentUserId,
      blocked_id: otherUserProfile.id
    })
    setSafetyBusy(false)
    if (!error) {
      setIsBlockedByMe(true)
    }
  }

  const handleUnblock = async () => {
    if (!otherUserProfile || !currentUserId) return
    setSafetyBusy(true)
    const { error } = await supabase.from("blocks")
      .delete()
      .eq("blocker_id", currentUserId)
      .eq("blocked_id", otherUserProfile.id)
    setSafetyBusy(false)
    if (!error) {
      setIsBlockedByMe(false)
    }
  }

  const handleDeleteChat = async () => {
    if (!otherUserProfile || !currentUserId) return
    if (!window.confirm("Are you sure you want to delete this chat and unmatch? You can choose to like each other again later.")) return
    
    setSafetyBusy(true)
    await supabase.from("matches").delete().eq("id", chatId)
    await supabase.from("swipes").delete()
      .in("swiper_id", [currentUserId, otherUserProfile.id])
      .in("swiped_id", [currentUserId, otherUserProfile.id])
      
    setSafetyBusy(false)
    router.push("/chat")
  }

  const toggleMute = async () => {
    if (!currentUserId) return
    setSafetyBusy(true)
    if (muted) {
      const { error: muteError } = await supabase
        .from("muted_matches")
        .delete()
        .eq("match_id", chatId)
        .eq("user_id", currentUserId)
      if (!muteError) setMuted(false)
    } else {
      const { error: muteError } = await supabase
        .from("muted_matches")
        .insert({ match_id: chatId, user_id: currentUserId })
      if (!muteError) setMuted(true)
    }
    setSafetyBusy(false)
  }

  const endConversation = async () => {
    const { data: mediaRows } = await supabase
      .from("messages")
      .select("media_path")
      .eq("match_id", chatId)
      .not("media_path", "is", null)
    const paths = (mediaRows || []).flatMap((row) => row.media_path ? [row.media_path] : [])
    if (paths.length > 0) await supabase.storage.from("chat-media").remove(paths)

    const { error: matchError } = await supabase.from("matches").delete().eq("id", chatId)
    if (matchError) {
      setError("Conversation couldn't be ended.")
      return false
    }
    router.push("/chat")
    return true
  }

  const confirmEndConversation = async () => {
    setSafetyBusy(true)
    const ended = await endConversation()
    if (!ended) setSafetyBusy(false)
  }

  const handleNextPhoto = (event: React.MouseEvent) => {
    event.stopPropagation()
    const count = otherUserProfile?.photos?.filter(Boolean).length || 1
    setActivePhotoIndex((current) => Math.min(current + 1, count - 1))
  }

  const handlePrevPhoto = (event: React.MouseEvent) => {
    event.stopPropagation()
    setActivePhotoIndex((current) => Math.max(current - 1, 0))
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm font-bold">Loading conversation...</div>
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent">
      <header className="relative flex flex-shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <button
          type="button"
          onClick={() => setProfileModalOpen(true)}
          className="flex min-w-0 items-center gap-3 text-left"
          aria-label={`View ${otherUserName}'s profile`}
        >
          <img src={otherUserAvatar} alt={otherUserName} className="size-10 flex-shrink-0 rounded-full border object-cover" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold sm:text-base">{otherUserName}</span>
            <span className="block truncate text-xs text-muted-foreground" aria-live="polite">
              {otherUserTyping
                ? "Typing..."
                : otherUserOnline
                  ? "Online"
                  : realtimeStatus === "offline"
                    ? "Reconnecting..."
                    : formatLastSeen(lastSeenAt)}
            </span>
          </span>
        </button>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-full [&_svg]:size-5"
            onClick={() => void toggleMute()}
            disabled={safetyBusy}
            aria-label={muted ? "Unmute conversation" : "Mute conversation"}
            title={muted ? "Unmute conversation" : "Mute conversation"}
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-full [&_svg]:size-5 text-destructive"
            onClick={handleBlock}
            disabled={safetyBusy || isBlockedByMe}
            aria-label="Block"
            title="Block"
          >
            <Ban />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-full [&_svg]:size-5 text-destructive"
            onClick={handleDeleteChat}
            disabled={safetyBusy}
            aria-label="Delete chat & Unmatch"
            title="Delete chat & Unmatch"
          >
            <Unlink />
          </Button>
        </div>
      </header>

      <div
        ref={scrollContainerRef}
        role="log"
        aria-label={`Conversation with ${otherUserName}`}
        aria-live="polite"
        onScroll={(event) => {
          const container = event.currentTarget
          if (container.scrollTop < 80) void loadOlderMessages()
          const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
          shouldScrollToBottomRef.current = distanceFromBottom < 160
        }}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3 sm:p-6"
      >
        {loadingMore ? <p className="text-center text-xs text-muted-foreground">Loading earlier messages...</p> : null}
        {!hasMore && messages.length > 0 ? <p className="text-center text-xs text-muted-foreground">Start of conversation</p> : null}

        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-4 px-4 text-center">
            <div>
              <p className="text-sm font-bold">Start a conversation with {otherUserName}</p>
              <p className="mt-1 text-xs text-muted-foreground">A shared detail makes the first message easier.</p>
            </div>
            <div className="flex w-full max-w-md flex-col gap-2">
              {conversationStarters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => updateComposer(starter)}
                  className="rounded-md border bg-background px-4 py-3 text-left text-xs transition hover:border-primary hover:bg-primary/5"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const previous = index > 0 ? messages[index - 1] : null
            const showDate = !previous || !sameCalendarDay(previous.created_at, message.created_at)
            const showAvatar = message.sender_id !== currentUserId && (!previous || previous.sender_id !== message.sender_id)

            return (
              <Fragment key={message.id}>
                {showDate ? (
                  <div className="flex items-center gap-3 py-1 text-[10px] font-bold uppercase text-muted-foreground" role="separator">
                    <span className="h-px flex-1 bg-border" />
                    <span>{formatMessageDate(message.created_at)}</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                ) : null}
                <MessageBubble
                  message={message}
                  replyMessage={message.reply_to_id ? messagesById.get(message.reply_to_id) || null : null}
                  reactions={reactions.filter((reaction) => reaction.message_id === message.id)}
                  currentUserId={currentUserId || ""}
                  otherUserName={otherUserName}
                  otherUserAvatar={otherUserAvatar}
                  showAvatar={showAvatar}
                  onReply={(selected) => {
                    setReplyTo(selected)
                    document.getElementById("chat-message")?.focus()
                  }}
                  onReact={reactToMessage}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                />
              </Fragment>
            )
          })
        )}
        <div ref={messagesEndRef} className="h-2 w-full flex-shrink-0" />
      </div>

      {isBlockedByMe ? (
        <div className="flex flex-col items-center justify-center p-6 bg-muted/30 border-t">
          <p className="text-sm font-semibold mb-4 text-muted-foreground">You blocked this user. They cannot message you.</p>
          <div className="flex gap-4">
            <Button onClick={handleUnblock} variant="outline" className="rounded-xl">Unblock</Button>
            <Button onClick={handleDeleteChat} variant="destructive" className="rounded-xl">Delete Chat</Button>
          </div>
        </div>
      ) : isBlockedByThem ? (
        <div className="flex flex-col items-center justify-center p-6 bg-muted/30 border-t">
          <p className="text-sm font-semibold text-muted-foreground">This user is unavailable.</p>
        </div>
      ) : (
        <ChatComposer
          value={newMessage}
          otherUserName={otherUserName}
          replyTo={replyTo}
          busy={composerBusy}
          recording={recording}
          recordingSeconds={recordingSeconds}
          error={error}
          starters={conversationStarters}
          onChange={updateComposer}
          onSend={sendTextMessage}
          onCancelReply={() => setReplyTo(null)}
          onUpload={uploadMedia}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onCancelRecording={cancelRecording}
        />
      )}

      {profileModalOpen && otherUserProfile ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-profile-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setProfileModalOpen(false)
          }}
        >
          <div className="relative w-full max-w-4xl xl:max-w-5xl">
            <h2 id="chat-profile-title" className="sr-only">{`${otherUserName}'s profile`}</h2>
            <ProfilePostCard
              profile={otherUserProfile}
              viewerProfile={currentUserProfile}
              avatarUrl={otherUserAvatar}
              photos={(otherUserProfile.photos || []).filter(Boolean) as string[]}
              activePhotoIndex={activePhotoIndex}
              onPrevPhoto={handlePrevPhoto}
              onNextPhoto={handleNextPhoto}
            />
          </div>
        </div>
      ) : null}

      <MotionModal
        open={endConversationOpen}
        placement="bottom"
        className="bg-black/70"
        panelClassName="w-full max-w-sm rounded-lg border bg-background p-5 shadow-xl"
        labelledBy="safety-title"
      >
            <h2 id="safety-title" className="text-lg font-bold">End conversation</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This removes the match and conversation for both people.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEndConversationOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void confirmEndConversation()}
                disabled={safetyBusy}
              >
                End conversation
              </Button>
            </div>
      </MotionModal>
    </div>
  )
}
