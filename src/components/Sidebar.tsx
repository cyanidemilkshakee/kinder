/* eslint-disable */
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Heart, MessageCircle, User, HeartHandshake, Settings, Info, LogOut, ScrollText, Loader2 } from "lucide-react"
import { createClient } from "@/lib/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat"

type UserProfile = {
  real_name: string
  username: string | null
  avatar_url: string | null
  id: string
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  usePresenceHeartbeat()

  useEffect(() => {
    let isMounted = true
    let channel: any

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('id, real_name, username, avatar_url')
        .eq('id', user.id)
        .single()
      if (data && isMounted) setUserProfile(data)

      if (!isMounted) return

      const fetchUnreadCount = async () => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false)
          .neq('sender_id', user.id)
        if (count !== null && isMounted) setUnreadChatCount(count)
      }

      // Fetch initial unread count
      await supabase
        .from('messages')
        .update({ delivered_at: new Date().toISOString() })
        .neq('sender_id', user.id)
        .is('delivered_at', null)

      await fetchUnreadCount()

      if (!isMounted) return

      // Listen for new messages globally
      channel = supabase
        .channel(`global-chat-notifications-${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async (payload) => {
          fetchUnreadCount() // Always re-calculate on any insert/update
          
          if (payload.eventType === 'INSERT' && payload.new.sender_id !== user.id && !payload.new.is_read) {
            await supabase
              .from('messages')
              .update({ delivered_at: new Date().toISOString() })
              .eq('id', payload.new.id)

            const { data: mutedMatch } = await supabase
              .from('muted_matches')
              .select('id')
              .eq('match_id', payload.new.match_id)
              .eq('user_id', user.id)
              .maybeSingle()
            if (mutedMatch) return

            const { data: sender } = await supabase.from('profiles').select('real_name').eq('id', payload.new.sender_id).single()
            setToastMessage(`New message from ${sender?.real_name || 'Someone'}`)
            setTimeout(() => setToastMessage(null), 3500)
          }
        })
        .subscribe()
    }
    fetchUser()
    return () => {
      isMounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    setProfileMenuOpen(false)
  }, [pathname])

  const upperLinks = [
    { name: "Discover", href: "/discover", icon: Home },
    { name: "Likes", href: "/likes", icon: Heart },
    { name: "Chat", href: "/chat", icon: MessageCircle },
    { name: "Confessions", href: "/confessions", icon: ScrollText },
  ]

  const bottomLinks = [
    { name: "Donate", href: "/donate", icon: HeartHandshake },
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
              <span className="tracking-wide flex-1">{item.name}</span>
              {item.name === "Chat" && unreadChatCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                  {unreadChatCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-5">
          <div className="rounded-full bg-sidebar-primary text-sidebar-primary-foreground px-6 py-3 shadow-xl text-sm font-semibold tracking-wide flex items-center gap-3">
            <MessageCircle className="h-5 w-5" />
            {toastMessage}
          </div>
        </div>
      )}

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
        </nav>

        {/* User info and Menu wrapper */}
        <div className="relative">
          {profileMenuOpen && (
            <div className="absolute bottom-full left-0 w-full mb-2 z-50 rounded-xl border border-sidebar-border/60 bg-[#ff9999] p-1.5 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-bottom-2">
              <Link
                href="/profile"
                className="group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-black/80 transition-all duration-200 hover:bg-black/10 hover:text-black"
              >
                <User className="mr-3 h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
                <span className="tracking-wide">Profile</span>
              </Link>
              <Link
                href="/settings"
                className="group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-black/80 transition-all duration-200 hover:bg-black/10 hover:text-black"
              >
                <Settings className="mr-3 h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
                <span className="tracking-wide">Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-black/80 transition-all duration-200 hover:bg-black/10 hover:text-black"
              >
                <LogOut className="mr-3 h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
                <span className="tracking-wide">Sign Out</span>
              </button>
            </div>
          )}

          {/* User info card */}
          <button
            type="button"
            onClick={() => setProfileMenuOpen((open) => !open)}
            aria-expanded={profileMenuOpen}
            className="flex w-full items-center gap-3 rounded-xl border border-sidebar-border/50 bg-sidebar-accent/50 px-3 py-3 text-left backdrop-blur-sm transition-all duration-200 hover:bg-sidebar-accent/70"
          >
            <div className="size-10 flex-shrink-0 overflow-hidden rounded-full bg-sidebar-accent shadow-sm">
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
              <p className="text-xs font-medium text-sidebar-foreground/40">
                {userProfile?.username ? `@${userProfile.username}` : "Set username"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
