"use client"

import { useRef, useState } from "react"
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
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const gifInputRef = useRef<HTMLInputElement>(null)
  const [startersOpen, setStartersOpen] = useState(false)

  const handleFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: Exclude<MessageType, "text" | "audio">
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) await onUpload(file, type)
  }

  return (
    <div className="border-t bg-background/95 p-3 backdrop-blur-md sm:p-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-2">
        {replyTo ? (
          <div className="flex items-center justify-between gap-3 rounded-md border-l-2 border-primary bg-muted/40 px-3 py-2 text-xs">
            <div className="min-w-0">
              <span className="font-bold">Replying to a message</span>
              <span className="block truncate text-muted-foreground">
                {replyTo.content || replyTo.message_type}
              </span>
            </div>
            <button type="button" onClick={onCancelReply} className="font-bold text-muted-foreground hover:text-foreground">
              Cancel
            </button>
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

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Button type="button" size="xs" variant="ghost" onClick={() => setStartersOpen((open) => !open)} aria-expanded={startersOpen}>
            Starters
          </Button>
          <Button type="button" size="xs" variant="outline" onClick={() => photoInputRef.current?.click()} disabled={busy || recording}>
            Photo
          </Button>
          <Button type="button" size="xs" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={busy || recording}>
            Video
          </Button>
          <Button type="button" size="xs" variant="outline" onClick={() => gifInputRef.current?.click()} disabled={busy || recording}>
            GIF
          </Button>
          {recording ? (
            <>
              <Button type="button" size="xs" variant="destructive" onClick={onStopRecording}>
                Stop {recordingSeconds}s
              </Button>
              <Button type="button" size="xs" variant="ghost" onClick={onCancelRecording}>
                Cancel recording
              </Button>
            </>
          ) : (
            <Button type="button" size="xs" variant="outline" onClick={() => void onStartRecording()} disabled={busy}>
              Voice
            </Button>
          )}

          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void handleFile(event, "image")}
            className="sr-only"
            aria-label="Upload a photo"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(event) => void handleFile(event, "video")}
            className="sr-only"
            aria-label="Upload a video"
          />
          <input
            ref={gifInputRef}
            type="file"
            accept="image/gif"
            onChange={(event) => void handleFile(event, "gif")}
            className="sr-only"
            aria-label="Upload a GIF"
          />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void onSend()
          }}
          className="flex items-end gap-2"
        >
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
            placeholder={`Message ${otherUserName}...`}
            rows={1}
            className="max-h-32 min-h-10 flex-1 resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/50"
            autoComplete="off"
            disabled={recording}
          />
          <Button type="submit" className="h-10 px-4" disabled={!value.trim() || busy || recording}>
            Send
          </Button>
        </form>
        <p className="sr-only" aria-live="polite">
          Press Enter to send, Shift Enter for a new line, and Escape to cancel a reply.
        </p>
      </div>
    </div>
  )
}
