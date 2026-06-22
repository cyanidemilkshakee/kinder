"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"

const HEARTBEAT_INTERVAL = 45_000

export function usePresenceHeartbeat() {
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    let mounted = true
    let userId: string | null = null

    const heartbeat = async () => {
      if (!mounted || !userId || document.visibilityState === "hidden") return
      await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", userId)
    }

    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted || !user) return
      userId = user.id
      await heartbeat()
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void heartbeat()
    }

    void initialize()
    const interval = window.setInterval(() => void heartbeat(), HEARTBEAT_INTERVAL)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      mounted = false
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [supabase])
}
