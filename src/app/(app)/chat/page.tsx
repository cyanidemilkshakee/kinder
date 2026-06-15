"use client"

import { MessageCircle } from "lucide-react"

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
      <MessageCircle className="h-16 w-16 mb-4 text-muted" />
      <h3 className="text-xl font-medium text-foreground mb-2">Your Messages</h3>
      <p>Select a match from the sidebar to start chatting.</p>
    </div>
  )
}
