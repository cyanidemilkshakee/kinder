"use client"

import { useRef, useState } from "react"
import { ImagePlus, Mic, MicOff, Send, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Message, MessageType } from "../chat-types"

type ChatComposerProps = {
  value: string
  otherUserName: string
  replyTo: Message | null
  busy: boolean
  recording: boolean
  recordingSeconds: number
  error: string | null
  starters: string[]
  onChange: (value: string) => void
  onSend: () => Promise<void>
  onCancelReply: () => void
  onUpload: (file: File, type: Exclude<MessageType, "text" | "audio">) => Promise<void>
  onStartRecording: () => Promise<void>
  onStopRecording: () => void
  onCancelRecording: () => void
}

export function ChatComposer({
  value,
  otherUserName,
  replyTo,
  busy,
  recording,
  recordingSeconds,
  error,
  starters,
  onChange,
  onSend,
  onCancelReply,
  onUpload,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
}: ChatComposerProps) {
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const gifInputRef = useRef<HTMLInputElement>(null)
  const [startersOpen, setStartersOpen] = useState(false)

  const handleMedia = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    await onUpload(file, file.type.startsWith("video/") ? "video" : "image")
  }

  const handleGif = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) await onUpload(file, "gif")
  }

  return (
    <div className="w-full border-t bg-background/95 p-3 backdrop-blur-md sm:p-4">
      <div className="flex w-full flex-col gap-2">
        {replyTo ? (
          <div className="flex items-center justify-between gap-3 rounded-md border-l-2 border-primary bg-muted/40 px-3 py-2 text-xs">
            <div className="min-w-0">
              <span className="font-bold">Replying to a message</span>
              <span className="block truncate text-muted-foreground">{replyTo.content || replyTo.message_type}</span>
            </div>
            <Button type="button" variant="ghost" size="icon-xs" onClick={onCancelReply} aria-label="Cancel reply" title="Cancel reply">
              <X />
            </Button>
          </div>
        ) : null}

        {error ? <p role="alert" className="text-xs font-semibold text-destructive">{error}</p> : null}

        {startersOpen ? (
          <div className="flex flex-col gap-1 rounded-md border bg-muted/30 p-2" aria-label="Conversation starters">
            {starters.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => {
                  onChange(starter)
                  setStartersOpen(false)
                }}
                className="rounded px-2 py-1.5 text-left text-xs hover:bg-background"
              >
                {starter}
              </button>
            ))}
          </div>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void onSend()
          }}
          className="flex w-full items-center gap-2"
        >
          <div className="flex h-14 shrink-0 items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 rounded-full [&_svg]:size-5"
              onClick={() => setStartersOpen((open) => !open)}
              aria-label="Conversation starters"
              title="Conversation starters"
              aria-expanded={startersOpen}
            >
              <Sparkles />
            </Button>
          </div>

          <div className="relative min-w-0 flex-1">
            <label htmlFor="chat-message" className="sr-only">Message {otherUserName}</label>
            <textarea
              id="chat-message"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && replyTo) onCancelReply()
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  if (value.trim() && !busy) void onSend()
                }
              }}
              placeholder="Send message..."
              rows={1}
              className="max-h-32 min-h-14 w-full resize-none overflow-y-auto rounded-lg border border-input bg-muted/35 py-4 pl-4 pr-44 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/50 dark:bg-muted/55"
              autoComplete="off"
              disabled={recording}
            />

            <div className="absolute inset-y-0 right-2 flex items-center gap-0.5">
              {recording ? (
                <>
                  <span className="px-1 text-[10px] font-bold text-destructive" aria-live="polite">{recordingSeconds}s</span>
                  <Button type="button" variant="ghost" size="icon" className="size-10 rounded-full [&_svg]:size-5" onClick={onCancelRecording} aria-label="Cancel voice note" title="Cancel voice note">
                    <X className="size-5" />
                  </Button>
                  <Button type="button" variant="destructive" size="icon" className="size-10 rounded-full [&_svg]:size-5" onClick={onStopRecording} aria-label="Stop and send voice note" title="Stop and send voice note">
                    <MicOff className="size-5" />
                  </Button>
                </>
              ) : (
                <div className="flex items-center -space-x-1">
                  <Button type="button" variant="ghost" size="icon" className="size-10 rounded-full [&_svg]:size-5" onClick={() => void onStartRecording()} disabled={busy} aria-label="Record voice note" title="Record voice note">
                    <Mic className="size-5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="size-10 rounded-full [&_svg]:size-5" onClick={() => mediaInputRef.current?.click()} disabled={busy} aria-label="Add photo or video" title="Media">
                    <ImagePlus className="size-5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="size-10 rounded-full" onClick={() => gifInputRef.current?.click()} disabled={busy} aria-label="Add GIF" title="GIF">
                    <span aria-hidden="true" className="rounded-[4px] border-[1.5px] border-current px-1 py-0.5 text-[9px] font-black leading-none tracking-[-0.04em]">
                      GIF
                    </span>
                  </Button>
                </div>
              )}
              <Button type="submit" size="icon" className="size-10 rounded-full [&_svg]:size-5" disabled={!value.trim() || busy || recording} aria-label="Send message" title="Send message">
                <Send className="size-5" />
              </Button>
            </div>
          </div>

          <input
            ref={mediaInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            onChange={(event) => void handleMedia(event)}
            className="sr-only"
            aria-label="Upload a photo or video"
          />
          <input
            ref={gifInputRef}
            type="file"
            accept="image/gif"
            onChange={(event) => void handleGif(event)}
            className="sr-only"
            aria-label="Upload a GIF"
          />
        </form>
        <p className="sr-only" aria-live="polite">
          Press Enter to send, Shift Enter for a new line, and Escape to cancel a reply.
        </p>
      </div>
    </div>
  )
}
