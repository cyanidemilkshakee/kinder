/* eslint-disable */
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

type Confession = {
  id: string
  content: string
  receiver_email: string
  receiver_username: string | null
  status: string
  created_at: string
}

export default function AdminConfessionsPage() {
  const [confessions, setConfessions] = useState<Confession[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchConfessions()
  }, [])

  async function fetchConfessions() {
    setLoading(true)
    const { data } = await supabase
      .from("confessions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
    
    if (data) setConfessions(data)
    setLoading(false)
  }

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    const { error } = await supabase
      .from("confessions")
      .update({ status: action })
      .eq("id", id)

    if (!error) {
      setConfessions(prev => prev.filter(c => c.id !== id))
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Pending Confessions</h2>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : confessions.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          No pending confessions to review.
        </div>
      ) : (
        <div className="grid gap-4">
          {confessions.map(c => (
            <div key={c.id} className="border-b border-border/50 py-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-md text-muted-foreground">
                    To: {c.receiver_username ? `@${c.receiver_username}` : c.receiver_email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-foreground font-medium bg-background border border-border/50 p-4 rounded-xl leading-relaxed">
                  "{c.content}"
                </p>
              </div>

              <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                <Button 
                  onClick={() => handleAction(c.id, "approved")}
                  className="flex-1 sm:w-32 rounded-xl bg-green-500 hover:bg-green-600 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Approve
                </Button>
                <Button 
                  onClick={() => handleAction(c.id, "rejected")}
                  variant="destructive"
                  className="flex-1 sm:w-32 rounded-xl"
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
