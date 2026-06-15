"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { InteractiveBackground } from "@/components/InteractiveBackground"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Determine variant based on path
  let variant: "home" | "chat" | "likes" | "profile" | "confessions" | "default" = "default"
  
  if (pathname.startsWith("/discover")) variant = "home"
  else if (pathname.startsWith("/chat")) variant = "chat"
  else if (pathname.startsWith("/likes")) variant = "likes"
  else if (pathname.startsWith("/profile")) variant = "profile"
  else if (pathname.startsWith("/confessions")) variant = "confessions"

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Background is placed at the absolute lowest layer */}
      <div className="fixed inset-0 z-0">
        <InteractiveBackground variant={variant as any} />
      </div>
      
      {/* App content layered above background */}
      <div className="relative z-10 flex w-full h-full">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {/* Floating theme toggle */}
      <div className="fixed bottom-4 right-4 z-50">
        <ThemeToggle />
      </div>
    </div>
  )
}
