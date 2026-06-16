/* eslint-disable */
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { useRouter, usePathname } from "next/navigation"
import { Loader2, ShieldAlert, ScrollText, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/")
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role === 'admin') {
      setIsAdmin(true)
    } else {
      router.push("/discover") // redirect non-admins
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) return null

  const navItems = [
    { name: "Confessions", path: "/admin/confessions", icon: ScrollText },
    { name: "Reports", path: "/admin/reports", icon: ShieldAlert },
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Admin Sidebar */}
      <div className="w-full md:w-64 bg-transparent border-r border-border p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 text-primary">
          <ShieldAlert className="h-6 w-6" />
          <h1 className="text-xl font-bold tracking-tight">Admin</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map(item => {
            const active = pathname === item.path
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  active 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/discover"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all font-medium text-sm mt-auto border border-border"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to App
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
