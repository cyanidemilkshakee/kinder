/* eslint-disable */
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ScrollText, Send, Info, Loader2 } from "lucide-react"

type Confession = {
  id: string
  content: string
  created_at: string
  is_revealed: boolean
}

export default function ConfessionsPage() {
  const [activeTab, setActiveTab] = useState<"receive" | "send">("receive")
  const [confessions, setConfessions] = useState<Confession[]>([])
  const [loading, setLoading] = useState(true)
  
  const [receiverEmail, setReceiverEmail] = useState("")
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{msg: string, type: "success" | "error" | "info"} | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    if (activeTab === "receive") {
      fetchConfessions()
    }
  }, [activeTab])

  async function fetchConfessions() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/")
      return
    }

    // Only fetch approved confessions for the current user
    const { data, error } = await supabase
      .from("confessions")
      .select("*")
      .eq("receiver_email", user.email)
      .eq("status", "approved")
      .order("created_at", { ascending: false })

    if (data) setConfessions(data)
    setLoading(false)
  }

  const revealConfession = async (id: string) => {
    const { error } = await supabase
      .from("confessions")
      .update({ is_revealed: true })
      .eq("id", id)
      
    if (error) {
      showToast("Failed to reveal confession.", "error")
    } else {
      setConfessions(prev => prev.map(c => c.id === id ? { ...c, is_revealed: true } : c))
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!receiverEmail.endsWith("@bmsce.ac.in")) {
      showToast("Please enter a valid institutional email.", "error")
      return
    }

    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("confessions").insert({
      sender_id: user.id,
      receiver_email: receiverEmail,
      content: content
    })

    if (error) {
      showToast("Failed to send confession.", "error")
    } else {
      showToast("Confession submitted! It will be reviewed by moderators before delivery.", "success")
      setReceiverEmail("")
      setContent("")
      setActiveTab("receive")
    }
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Confessions</h1>
            <p className="text-sm text-muted-foreground">Anonymous expression, moderated for safety.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 mb-6 gap-1">
          <button
            onClick={() => setActiveTab("receive")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === "receive" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Received
          </button>
          <button
            onClick={() => setActiveTab("send")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === "send" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Send Anonymous
          </button>
        </div>

        {/* Receive Tab */}
        {activeTab === "receive" && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : confessions.length > 0 ? (
              confessions.map((c) => (
                <div key={c.id} className="p-5 relative overflow-hidden group">
                  {c.is_revealed ? (
                    <>
                      {/* Decorative quote mark */}
                      <div className="absolute top-2 right-4 text-6xl text-primary/10 font-serif leading-none select-none">
                        "
                      </div>
                      
                      <p className="text-foreground text-[15px] leading-relaxed relative z-10 font-medium">
                        {c.content}
                      </p>
                      
                      <div className="flex items-center justify-between mt-4 relative z-10 pt-3 border-t border-border/50">
                        <span className="text-xs font-semibold text-primary">Anonymous Sender</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-4">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center mb-3">
                        <ScrollText className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold text-sm">You have an anonymous confession!</h4>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">Accept to reveal the message.</p>
                      <Button onClick={() => revealConfession(c.id)} className="rounded-xl w-full max-w-[200px]" size="sm">
                        Accept & Read
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ScrollText className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-bold">No Confessions Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
                  When someone sends you an approved anonymous message, it will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Send Tab */}
        {activeTab === "send" && (
          <div className="p-6">
            <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl mb-6 text-sm text-foreground">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p>
                Confessions are <strong>100% anonymous</strong>. All messages are manually reviewed by moderation before delivery to prevent abuse.
              </p>
            </div>

            <form onSubmit={handleSend} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Recipient Email</label>
                <input
                  type="email"
                  required
                  value={receiverEmail}
                  onChange={(e) => setReceiverEmail(e.target.value)}
                  placeholder="their.name@college.edu"
                  className="block w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Your Message</label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="I saw you at the library today..."
                  className="block w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                />
                <div className="flex justify-end">
                  <span className={`text-xs ${content.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {content.length} / 500
                  </span>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full rounded-xl gap-2" 
                disabled={sending || content.length > 500 || content.length === 0 || !receiverEmail}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sending ? "Submitting..." : "Submit Confession"}
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast px-5 py-3 rounded-2xl text-sm font-medium ${
          toast.type === "success" 
            ? "bg-primary text-primary-foreground" 
            : toast.type === "error"
            ? "bg-destructive text-white"
            : "bg-background border border-border text-foreground"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
