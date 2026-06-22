 
"use client"

import { ChatSidebar } from "./ChatSidebar"
import { usePathname } from "next/navigation"

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full bg-transparent overflow-hidden">
      <ChatSidebar />
      <div className={`${pathname === "/chat" ? "hidden md:flex" : "flex"} min-w-0 flex-1 flex-col relative bg-background/50`}>
        {children}
      </div>
    </div>
  )
}
