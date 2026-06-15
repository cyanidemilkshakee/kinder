"use client"

import { ChatSidebar } from "./ChatSidebar"

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full bg-card rounded-xl border shadow-sm overflow-hidden">
      <ChatSidebar />
      <div className="flex-1 flex flex-col relative bg-background/50">
        {children}
      </div>
    </div>
  )
}
