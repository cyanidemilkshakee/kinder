"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { AdminSidebar } from "@/components/AdminSidebar"

type AdminProfile = {
  id: string
  real_name: string | null
  username: string | null
  avatar_url: string | null
  role: string | null
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    let isMounted = true

    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/")
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, real_name, username, avatar_url, role")
        .eq("id", user.id)
        .single()

      if (!isMounted) return

      if (data?.role === "admin") {
        setProfile(data)
      } else {
        router.replace("/discover")
      }

      setLoading(false)
    }

    checkAdmin()

    return () => {
      isMounted = false
    }
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F2F2] text-[#1C1C1C] dark:bg-[#1C1C1C] dark:text-[#F2F2F2]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6F3C]" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="flex h-screen overflow-hidden bg-[#F2F2F2] text-[#1C1C1C] dark:bg-[#1C1C1C] dark:text-[#F2F2F2]">
      <AdminSidebar profile={profile} />
      <main className="min-w-0 flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
