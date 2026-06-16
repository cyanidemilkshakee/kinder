/* eslint-disable */
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Loader2, Ban, ShieldCheck, AlertTriangle } from "lucide-react"

type Report = {
  id: string
  reason: string
  status: string
  created_at: string
  reported_id: string
  reported: {
    real_name: string
    email: string
    is_suspended: boolean
    ban_expires_at: string | null
  }
  reporter: {
    real_name: string
  }
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    setLoading(true)
    const { data } = await supabase
      .from("reports")
      .select(`
        id, reason, status, created_at, reported_id,
        reported:profiles!reported_id(real_name, email, is_suspended, ban_expires_at),
        reporter:profiles!reporter_id(real_name)
      `)
      .order("created_at", { ascending: false })
    
    if (data) setReports(data as unknown as Report[])
    setLoading(false)
  }

  const markActionTaken = async (reportId: string) => {
    await supabase.from("reports").update({ status: 'action_taken' }).eq("id", reportId)
    fetchReports()
  }

  const suspendUser = async (userId: string, reportId: string) => {
    await supabase.from("profiles").update({ is_suspended: true, ban_expires_at: null }).eq("id", userId)
    await markActionTaken(reportId)
  }

  const tempBanUser = async (userId: string, reportId: string) => {
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)
    await supabase.from("profiles").update({ ban_expires_at: expires.toISOString() }).eq("id", userId)
    await markActionTaken(reportId)
  }

  const dismissReport = async (reportId: string) => {
    await supabase.from("reports").update({ status: 'reviewed' }).eq("id", reportId)
    fetchReports()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">User Reports</h2>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          No reports found.
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map(r => {
            const isSuspended = r.reported?.is_suspended
            const isTempBanned = r.reported?.ban_expires_at && new Date(r.reported.ban_expires_at) > new Date()

            return (
              <div key={r.id} className={`border-b py-5 ${r.status !== 'pending' ? 'opacity-60 border-border/50' : 'border-destructive/30'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${r.status === 'pending' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                        {r.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </div>

                    <h4 className="font-semibold text-lg">{r.reported?.real_name} <span className="text-sm font-normal text-muted-foreground">({r.reported?.email})</span></h4>
                    
                    <div className="mt-1 mb-3 flex items-center gap-2">
                      {isSuspended && <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded">Suspended</span>}
                      {isTempBanned && <span className="text-xs font-semibold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">Temp Banned until {new Date(r.reported.ban_expires_at!).toLocaleDateString()}</span>}
                    </div>

                    <div className="bg-muted p-3 rounded-xl border border-border/50">
                      <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Reported Reason:</p>
                      <p className="text-sm font-medium">{r.reason}</p>
                      <p className="text-xs text-muted-foreground mt-2">Reported by: {r.reporter?.real_name}</p>
                    </div>
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex flex-col gap-2 w-full sm:w-40 flex-shrink-0">
                      <Button onClick={() => dismissReport(r.id)} variant="outline" className="w-full rounded-xl" size="sm">
                        <ShieldCheck className="h-4 w-4 mr-2" /> Dismiss
                      </Button>
                      <Button onClick={() => tempBanUser(r.reported_id, r.id)} variant="secondary" className="w-full rounded-xl text-orange-500 bg-orange-500/10 hover:bg-orange-500/20" size="sm">
                        <AlertTriangle className="h-4 w-4 mr-2" /> 7-Day Ban
                      </Button>
                      <Button onClick={() => suspendUser(r.reported_id, r.id)} variant="destructive" className="w-full rounded-xl" size="sm">
                        <Ban className="h-4 w-4 mr-2" /> Suspend
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
