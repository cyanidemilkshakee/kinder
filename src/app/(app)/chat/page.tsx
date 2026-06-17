 
"use client"

import { MessageCircle } from "lucide-react"

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
      <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 shadow-sm">
        <MessageCircle className="h-10 w-10 text-primary/60" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Your Messages</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Select a match from the sidebar to start chatting.
      </p>
    </div>
  )
}
