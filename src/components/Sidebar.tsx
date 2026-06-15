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
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur-md flex-shrink-0">
      {/* App Name */}
      <div className="flex h-16 shrink-0 items-center px-5 border-b border-sidebar-border">
        <Link href="/discover" className="flex items-center gap-2">
          <span className="text-3xl font-extrabold tracking-tighter text-primary">Kinder</span>
          <span className="text-xs font-medium text-muted-foreground mt-1">✦ BMSCE</span>
        </Link>
      </div>

      {/* Upper Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {upperLinks.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary/15 text-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-foreground"
              }`}
            >
              <item.icon
                className={`mr-3 h-4.5 w-4.5 flex-shrink-0 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}
                aria-hidden="true"
              />
              <span>{item.name}</span>
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <nav className="space-y-0.5 mb-3">
          {bottomLinks.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary/15 text-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/20 hover:text-foreground"
                }`}
              >
                <item.icon
                  className={`mr-3 h-4 w-4 flex-shrink-0 ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}

          <button
            onClick={handleLogout}
            className="group flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
          >
            <LogOut className="mr-3 h-4 w-4 flex-shrink-0" />
            Sign Out
          </button>
        </nav>

        {/* User info */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-muted/40">
          <div className="h-8 w-8 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0">
            {avatar ? (
              <img src={avatar} alt="You" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{userProfile?.real_name || 'You'}</p>
            <p className="text-xs text-muted-foreground">BMSCE</p>
          </div>
        </div>
      </div>
    </div>
  )
}
