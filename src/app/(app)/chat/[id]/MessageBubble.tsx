"use client"

import { useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  REACTION_OPTIONS,
  type Message,
  type MessageReaction,
} from "../chat-types"

type MessageBubbleProps = {
  message: Message
  replyMessage: Message | null
  reactions: MessageReaction[]
  currentUserId: string
  otherUserName: string
  otherUserAvatar: string
  showAvatar: boolean
  onReply: (message: Message) => void
  onReact: (message: Message, emoji: string) => Promise<void>
  onEdit: (message: Message, content: string) => Promise<boolean>
  onDelete: (message: Message) => Promise<boolean>
}

export function MessageBubble({
  message,
  replyMessage,
  reactions,
  currentUserId,
  otherUserName,
  otherUserAvatar,
  showAvatar,
  onReply,
  onReact,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const isMe = message.sender_id === currentUserId
  const [actionsOpen, setActionsOpen] = useState(false)
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editDraft, setEditDraft] = useState(message.content)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, setPending] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const groupedReactions = useMemo(() => {
    const groups = new Map<string, { count: number; mine: boolean }>()
    for (const reaction of reactions) {
      const current = groups.get(reaction.emoji) || { count: 0, mine: false }
      groups.set(reaction.emoji, {
        count: current.count + 1,
        mine: current.mine || reaction.user_id === currentUserId,
      })
    }
    return Array.from(groups.entries())
  }, [currentUserId, reactions])

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  const receipt = message.id.startsWith("temp-")
    ? "Sending"
    : message.read_at
      ? "Read"
      : message.delivered_at
        ? "Delivered"
        : "Sent"

  const submitEdit = async (event: React.FormEvent) => {
    event.preventDefault()
    const content = editDraft.trim()
    if (!content || content === message.content) {
      setEditing(false)
      setEditDraft(message.content)
      return
    }

    setPending(true)
    const saved = await onEdit(message, content)
    setPending(false)
    if (saved) setEditing(false)
  }

  const deleteMessage = async () => {
    setPending(true)
    const deleted = await onDelete(message)
    setPending(false)
    if (deleted) {
      setConfirmDelete(false)
      setActionsOpen(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.target !== event.currentTarget || message.deleted_at) return

    if (event.key.toLowerCase() === "r") {
      event.preventDefault()
      onReply(message)
    } else if (isMe && event.key.toLowerCase() === "e") {
      event.preventDefault()
      setEditing(true)
    } else if (isMe && event.key === "Delete") {
      event.preventDefault()
      setConfirmDelete(true)
      setActionsOpen(true)
    }
  }

  const renderMedia = () => {
    if (!message.media_path || !message.media_url) return null

    if (message.message_type === "image" || message.message_type === "gif") {
      return (
        <img
          src={message.media_url}
          alt={message.media_metadata.name || "Shared image"}
          className="max-h-96 w-full rounded-md object-contain"
          loading="lazy"
        />
      )
    }

    if (message.message_type === "video") {
      return (
        <video
          src={message.media_url}
          controls
          preload="metadata"
          className="max-h-96 w-full rounded-md bg-black"
          aria-label={message.media_metadata.name || "Shared video"}
        />
      )
    }

    if (message.message_type === "audio") {
      return (
        <audio
          src={message.media_url}
          controls
          preload="metadata"
          className="w-full min-w-56"
          aria-label="Voice note"
        />
      )
    }

    return null
  }

  return (
    <div
      id={`message-${message.id}`}
      role="listitem"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={(event) => {
        const touch = event.changedTouches[0]
        if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY }
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current
        const touch = event.changedTouches[0]
        touchStart.current = null
        if (!start || !touch || message.deleted_at) return

        const deltaX = touch.clientX - start.x
        const deltaY = touch.clientY - start.y
        if (deltaX > 56 && Math.abs(deltaY) < 48) onReply(message)
      }}
      className={cn(
        "group flex animate-in fade-in slide-in-from-bottom-1 duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        isMe ? "justify-end" : "justify-start"
      )}
      aria-label={`${isMe ? "You" : otherUserName}: ${message.deleted_at ? "Message deleted" : message.content || message.message_type}`}
    >
      <div className={cn("flex max-w-[82%] gap-2 sm:max-w-[72%]", isMe && "flex-row-reverse")}>
        {!isMe && (
          <div className="flex w-8 flex-shrink-0 items-end pb-1">
            {showAvatar ? (
              <img
                src={otherUserAvatar}
                alt={otherUserName}
                className="size-8 rounded-full border object-cover"
              />
            ) : null}
          </div>
        )}

        <div className={cn("flex min-w-0 flex-col", isMe ? "items-end" : "items-start")}>
          <div
            className={cn(
              "min-w-0 rounded-2xl px-3 py-2 text-sm shadow-sm transition-opacity",
              pending && "opacity-65",
              isMe
                ? "rounded-tr-sm bg-primary text-primary-foreground"
                : "rounded-tl-sm border bg-background text-foreground"
            )}
          >
            {message.deleted_at ? (
              <span className="italic opacity-70">Message deleted</span>
            ) : editing ? (
              <form onSubmit={submitEdit} className="flex min-w-56 flex-col gap-2">
                <label htmlFor={`edit-${message.id}`} className="sr-only">Edit message</label>
                <input
                  id={`edit-${message.id}`}
                  value={editDraft}
                  onChange={(event) => setEditDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setEditing(false)
                      setEditDraft(message.content)
                    }
                  }}
                  className="w-full rounded-md border border-black/20 bg-background px-2 py-1.5 text-foreground outline-none focus:border-foreground"
                  autoFocus
                />
                <div className="flex justify-end gap-3 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false)
                      setEditDraft(message.content)
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={!editDraft.trim() || pending}>Save</button>
                </div>
              </form>
            ) : (
              <div className="flex min-w-0 flex-col gap-2">
                {message.reply_to_id ? (
                  <button
                    type="button"
                    onClick={() => document.getElementById(`message-${message.reply_to_id}`)?.focus()}
                    className="border-l-2 border-current/50 pl-2 text-left text-xs opacity-75"
                  >
                    <span className="block font-bold">
                      {replyMessage?.sender_id === currentUserId ? "You" : otherUserName}
                    </span>
                    <span className="block max-w-64 truncate">
                      {replyMessage?.deleted_at
                        ? "Message deleted"
                        : replyMessage?.content || replyMessage?.message_type || "Earlier message"}
                    </span>
                  </button>
                ) : null}
                {renderMedia()}
                {message.media_path && !message.media_url ? (
                  <span className="text-xs opacity-70">Media unavailable</span>
                ) : null}
                {message.content ? <p className="whitespace-pre-wrap break-words">{message.content}</p> : null}
              </div>
            )}
          </div>

          {groupedReactions.length > 0 && !message.deleted_at ? (
            <div className="mt-1 flex flex-wrap gap-1" aria-label="Message reactions">
              {groupedReactions.map(([emoji, group]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => void onReact(message, emoji)}
                  className={cn(
                    "rounded-full border bg-background px-2 py-0.5 text-xs transition hover:border-primary",
                    group.mine && "border-primary bg-primary/10"
                  )}
                  aria-label={`${emoji} reaction, ${group.count}`}
                  aria-pressed={group.mine}
                >
                  {emoji} {group.count}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-1 flex max-w-full items-center gap-3 px-1 text-[10px] text-muted-foreground">
            <span>{time}{message.edited_at && !message.deleted_at ? " - Edited" : ""}</span>
            {isMe ? <span>{receipt}</span> : null}

            {!message.deleted_at ? (
              <button
                type="button"
                onClick={() => setActionsOpen((open) => !open)}
                className="font-bold opacity-70 hover:text-foreground focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                aria-expanded={actionsOpen}
              >
                Actions
              </button>
            ) : null}
          </div>

          {actionsOpen && !message.deleted_at ? (
            <div className="mt-1 flex flex-wrap justify-end gap-3 rounded-md border bg-background px-2 py-1.5 text-xs shadow-sm">
              <button type="button" onClick={() => onReply(message)} className="font-bold hover:text-primary">
                Reply
              </button>
              <button
                type="button"
                onClick={() => setReactionPickerOpen((open) => !open)}
                className="font-bold hover:text-primary"
                aria-expanded={reactionPickerOpen}
              >
                React
              </button>
              {isMe ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true)
                    setActionsOpen(false)
                  }}
                  className="font-bold hover:text-primary"
                >
                  Edit
                </button>
              ) : null}
              {isMe ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="font-bold text-destructive"
                >
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}

          {reactionPickerOpen && !message.deleted_at ? (
            <div className="mt-1 flex gap-1 rounded-full border bg-background p-1 shadow-sm" aria-label="Choose a reaction">
              {REACTION_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={async () => {
                    await onReact(message, emoji)
                    setReactionPickerOpen(false)
                    setActionsOpen(false)
                  }}
                  className="flex size-8 items-center justify-center rounded-full text-base hover:bg-muted"
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}

          {confirmDelete ? (
            <div className="mt-1 flex items-center gap-2 rounded-md border border-destructive/30 bg-background px-2 py-1.5 text-xs">
              <span>Delete for everyone?</span>
              <button type="button" onClick={() => setConfirmDelete(false)} className="font-bold">Cancel</button>
              <button type="button" onClick={() => void deleteMessage()} disabled={pending} className="font-bold text-destructive">
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
