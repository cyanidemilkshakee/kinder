import type { PostProfile } from "@/components/ProfilePostCard"

export type MessageType = "text" | "image" | "video" | "gif" | "audio"

export type MediaMetadata = {
  duration?: number
  height?: number
  name?: string
  size?: number
  width?: number
}

export type Message = {
  id: string
  match_id: string
  content: string
  sender_id: string
  created_at: string
  is_read: boolean
  edited_at: string | null
  deleted_at: string | null
  reply_to_id: string | null
  message_type: MessageType
  media_path: string | null
  media_metadata: MediaMetadata
  delivered_at: string | null
  read_at: string | null
  media_url?: string | null
}

export type MessageReaction = {
  id: string
  message_id: string
  match_id: string
  user_id: string
  emoji: string
  created_at: string
}

export const MESSAGE_SELECT = [
  "id",
  "match_id",
  "content",
  "sender_id",
  "created_at",
  "is_read",
  "edited_at",
  "deleted_at",
  "reply_to_id",
  "message_type",
  "media_path",
  "media_metadata",
  "delivered_at",
  "read_at",
].join(", ")

export const REACTION_OPTIONS = ["❤️", "👍", "😂", "😮", "😢"] as const

export function mergeMessages(current: Message[], incoming: Message[]) {
  const messagesById = new Map(current.map((message) => [message.id, message]))

  for (const message of incoming) {
    const existing = messagesById.get(message.id)
    messagesById.set(message.id, {
      ...existing,
      ...message,
      media_url:
        message.media_url !== undefined
          ? message.media_url
          : existing?.media_path === message.media_path
            ? existing.media_url
            : null,
    })
  }

  return Array.from(messagesById.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
}

export function sameCalendarDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

export function formatMessageDate(value: string) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  })
}

export function formatLastSeen(value: string | null) {
  if (!value) return "Offline"

  const date = new Date(value)
  const elapsed = Date.now() - date.getTime()
  if (elapsed < 90_000) return "Online"

  return `Last seen ${date.toLocaleString([], {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  })}`
}

export function buildConversationStarters(
  viewer: PostProfile | null,
  other: PostProfile | null
) {
  if (!other) return []

  const viewerInterests = new Set(
    (viewer?.interest_tags || []).map((interest) => interest.toLowerCase())
  )
  const sharedInterests = (other.interest_tags || []).filter((interest) =>
    viewerInterests.has(interest.toLowerCase())
  )
  const starters: string[] = []

  if (sharedInterests[0]) {
    starters.push(`We both like ${sharedInterests[0]}. What got you into it?`)
  }
  if (viewer?.department && viewer.department === other.department) {
    starters.push(`What is your favorite thing about ${other.department}?`)
  } else if (other.department) {
    starters.push(`What made you choose ${other.department}?`)
  }
  if (other.year) {
    starters.push(`What has been the best part of ${other.year} year so far?`)
  }
  if (other.interest_tags?.[0] && !sharedInterests[0]) {
    starters.push(`I noticed you like ${other.interest_tags[0]}. Tell me more about it?`)
  }

  starters.push("What is your favorite place to hang out around campus?")
  starters.push("What is something you have been looking forward to lately?")

  return Array.from(new Set(starters)).slice(0, 4)
}
