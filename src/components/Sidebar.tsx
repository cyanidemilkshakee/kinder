/* eslint-disable */
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Heart, MessageCircle, User, HeartHandshake, Settings, Info, LogOut, ScrollText, Loader2 } from "lucide-react"
import { createClient } from "@/lib/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type UserProfile = {
  real_name: string
  avatar_url: string | null
  id: string
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('id, real_name, avatar_url')
        .eq('id', user.id)
        .single()
      if (data) setUserProfile(data)
    }
    fetchUser()
  }, [])

  const upperLinks = [
    { name: "Discover", href: "/discover", icon: Home },
    { name: "Likes", href: "/likes", icon: Heart },
    { name: "Chat", href: "/chat", icon: MessageCircle },
    { name: "Confessions", href: "/confessions", icon: ScrollText },
    { name: "Profile", href: "/profile", icon: User },
  ]

  const bottomLinks = [
    { name: "Donate", href: "/donate", icon: HeartHandshake },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "About", href: "/about", icon: Info },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const avatar = userProfile?.avatar_url
    || (userProfile?.id ? `https://api.dicebear.com/9.x/micah/svg?seed=${userProfile.id}` : null)

  return (
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar flex-shrink-0 relative">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-black/[0.08] pointer-events-none" />

      {/* App Name */}
      <div className="relative flex h-16 shrink-0 items-center px-5 border-b border-sidebar-border">
        <Link href="/discover" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-xl bg-sidebar-primary/20 flex items-center justify-center group-hover:bg-sidebar-primary/30 transition-colors">
            <Heart className="h-4 w-4 text-sidebar-primary fill-sidebar-primary" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-extrabold tracking-tight text-sidebar-foreground">Kinder</span>
          </div>
        </Link>
      </div>

      {/* Upper Navigation */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {upperLinks.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-primary/20 text-sidebar-primary shadow-sm"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon
                className={`mr-3 h-[18px] w-[18px] flex-shrink-0 transition-colors ${
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                }`}
                aria-hidden="true"
              />
              <span className="tracking-wide">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Divider with label */}
      <div className="relative px-5 py-1">
        <div className="h-px w-full bg-sidebar-border" />
      </div>

      {/* Bottom Section */}
      <div className="relative shrink-0 p-3 pt-2">
        <nav className="space-y-0.5 mb-3">
          {bottomLinks.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-sidebar-primary/20 text-sidebar-primary shadow-sm"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon
                  className={`mr-3 h-[18px] w-[18px] flex-shrink-0 transition-colors ${
                    isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                  }`}
                  aria-hidden="true"
                />
                <span className="tracking-wide">{item.name}</span>
              </Link>
            )
          })}

          <button
            onClick={handleLogout}
            className="group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 hover:bg-black/10 hover:text-sidebar-foreground transition-all duration-200"
          >
            <LogOut className="mr-3 h-[18px] w-[18px] flex-shrink-0" />
            <span className="tracking-wide">Sign Out</span>
          </button>
        </nav>

        {/* User info card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/50 backdrop-blur-sm">
          <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-sidebar-primary/30 bg-sidebar-accent flex-shrink-0 shadow-sm">
            {avatar ? (
              <img src={avatar} alt="You" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-sidebar-foreground/50" />
              </div>
            )}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-sidebar-foreground">{userProfile?.real_name || 'Loading…'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
