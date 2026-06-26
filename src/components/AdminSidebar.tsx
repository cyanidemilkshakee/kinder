"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import {
  Heart,
  LogOut,
  MessageSquare,
  Moon,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react"
import { createClient } from "@/lib/client"
import { SwitchThumb } from "@/components/AnimatedSwitch"

type AdminProfile = {
  id: string
  real_name: string | null
  username: string | null
  avatar_url: string | null
}

type AdminSidebarProps = {
  profile: AdminProfile
}

const adminNavItems = [
  { name: "Profiles", href: "/admin/profiles", icon: Users },
  { name: "Likes", href: "/admin/likes", icon: Heart },
  { name: "Confessions", href: "/admin/confessions", icon: ScrollText },
  { name: "Reports", href: "/admin/reports", icon: ShieldAlert },
  { name: "Contact", href: "/admin/contact", icon: MessageSquare },
]

function AdminThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const dark = (resolvedTheme || theme) === "dark"

  return (
    <button
      type="button"
      className="group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-[#F2F2F2]/85 transition-all hover:bg-[#FF6F3C]/20 hover:text-[#F2F2F2] dark:text-[#1C1C1C]/85 dark:hover:bg-[#CC4C1A]/15 dark:hover:text-[#1C1C1C]"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Toggle theme"
      role="switch"
      aria-checked={dark}
    >
      <span className="relative mr-3 flex size-[18px] flex-shrink-0 items-center justify-center" aria-hidden="true">
        <Sun className="absolute size-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </span>
      <span className="tracking-wide">Theme</span>
      <span className="ml-auto">
        <SwitchThumb checked={dark} />
      </span>
    </button>
  )
}

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [profileMenuOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const avatar =
    profile.avatar_url ||
    `https://api.dicebear.com/9.x/micah/svg?seed=${profile.id}`

  return (
    <aside className="relative flex h-screen w-64 flex-shrink-0 flex-col overflow-hidden bg-[#FF6F3C] text-[#1C1C1C] shadow-2xl shadow-[#CC4C1A]/20 dark:bg-[#CC4C1A] dark:text-[#F2F2F2]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.32),_transparent_32%),linear-gradient(180deg,_rgba(255,159,117,0.35),_transparent_48%)]" />

      <div className="relative flex h-16 shrink-0 items-center border-b border-[#1C1C1C]/15 px-5 dark:border-[#F2F2F2]/15">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-[#1C1C1C] text-[#F2F2F2] shadow-lg shadow-[#1C1C1C]/15 dark:bg-[#F2F2F2] dark:text-[#1C1C1C]">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-black uppercase tracking-[0.2em]">Kinder</p>
            <p className="text-xs font-bold opacity-70">Admin</p>
          </div>
        </Link>
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setProfileMenuOpen(false)}
                className={`group flex items-center rounded-2xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-[#1C1C1C] text-[#F2F2F2] shadow-lg shadow-[#1C1C1C]/15 dark:bg-[#F2F2F2] dark:text-[#1C1C1C]"
                    : "text-[#1C1C1C]/75 hover:bg-[#FF9F75] hover:text-[#1C1C1C] dark:text-[#F2F2F2]/78 dark:hover:bg-[#FF9F75]/25 dark:hover:text-[#F2F2F2]"
                }`}
              >
                <item.icon className="mr-3 size-[18px] flex-shrink-0" aria-hidden="true" />
                <span className="tracking-wide">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="relative shrink-0 p-3">
        <div className="relative" ref={menuRef}>
          {profileMenuOpen && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-full rounded-2xl border border-[#F2F2F2]/10 bg-[#1C1C1C] p-1.5 text-[#F2F2F2] shadow-2xl shadow-[#1C1C1C]/25 animate-in fade-in slide-in-from-bottom-2 dark:border-[#1C1C1C]/10 dark:bg-[#F2F2F2] dark:text-[#1C1C1C]">
              <Link
                href="/admin/settings"
                onClick={() => setProfileMenuOpen(false)}
                className="group flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-[#F2F2F2]/85 transition-all hover:bg-[#FF6F3C]/20 hover:text-[#F2F2F2] dark:text-[#1C1C1C]/85 dark:hover:bg-[#CC4C1A]/15 dark:hover:text-[#1C1C1C]"
              >
                <Settings className="mr-3 size-[18px] flex-shrink-0" aria-hidden="true" />
                <span className="tracking-wide">Settings</span>
              </Link>
              <AdminThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                className="group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-[#F2F2F2]/85 transition-all hover:bg-[#FF6F3C]/20 hover:text-[#F2F2F2] dark:text-[#1C1C1C]/85 dark:hover:bg-[#CC4C1A]/15 dark:hover:text-[#1C1C1C]"
              >
                <LogOut className="mr-3 size-[18px] flex-shrink-0" aria-hidden="true" />
                <span className="tracking-wide">Sign Out</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setProfileMenuOpen((open) => !open)}
            aria-expanded={profileMenuOpen}
            className="flex w-full items-center gap-3 rounded-2xl border border-[#1C1C1C]/15 bg-[#FF9F75]/45 px-3 py-3 text-left transition-all duration-200 hover:bg-[#FF9F75]/70 dark:border-[#F2F2F2]/15 dark:bg-[#1C1C1C]/18 dark:hover:bg-[#1C1C1C]/28"
          >
            <div className="size-10 flex-shrink-0 overflow-hidden rounded-full bg-[#F2F2F2] shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar} alt="Admin profile" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-black">
                {profile.real_name || "Admin"}
              </p>
              <p className="truncate text-xs font-bold opacity-65">
                {profile.username ? `@${profile.username}` : "Admin account"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </aside>
  )
}
