"use client"

import { Sidebar } from "@/components/Sidebar"
import { InteractiveBackground } from "@/components/InteractiveBackground"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Background is placed at the absolute lowest layer */}
      <div className="fixed inset-0 z-0">
        <InteractiveBackground />
      </div>
      
      {/* App content layered above background */}
      <div className="relative z-10 flex w-full h-full">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
