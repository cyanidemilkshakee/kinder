"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Loader2, Moon, Sun, Monitor, AlertTriangle, Shield, EyeOff, Eye, Flame, Trash2 } from "lucide-react"

type ProfileSettings = {
  id: string
  is_visible: boolean
  hookup_opt_in: boolean
  hookup_opt_in_changed_at: string | null
  deletion_queued_at: string | null
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<ProfileSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{msg: string, type: "success" | "error" | "info"} | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const supabase = createClient()

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("profiles")
        .select("id, is_visible, hookup_opt_in, hookup_opt_in_changed_at, deletion_queued_at")
        .eq("id", user.id)
        .single()

      if (error) throw error
      setSettings(data)
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: keyof ProfileSettings, value: any) => {
    if (!settings) return
    
    // PRD: Hookup intent 24hr cooldown check
    if (key === 'hookup_opt_in' && settings.hookup_opt_in_changed_at) {
      const lastChanged = new Date(settings.hookup_opt_in_changed_at)
      const now = new Date()
      const hoursDiff = (now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60)
      if (hoursDiff < 24) {
        showToast(`You can only change this once every 24 hours. Try again later.`, "error")
        return
      }
    }

    const updates: any = { [key]: value }
    if (key === 'hookup_opt_in') {
      updates.hookup_opt_in_changed_at = new Date().toISOString()
    }

    setSettings({ ...settings, ...updates })
    setSaving(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", settings.id)

      if (error) {
        setSettings({ ...settings }) // revert
        throw error
      }
      showToast("Settings updated successfully", "success")
    } catch (error: any) {
      showToast("Failed to update setting: " + error.message, "error")
    } finally {
      setSaving(false)
    }
  }

  const handleAccountAction = async () => {
    if (!settings) return

    if (settings.deletion_queued_at) {
      // Cancel deletion
      await updateSetting('deletion_queued_at', null)
      setDeleteConfirm(false)
    } else {
      // Execute deletion queue
      if (!deleteConfirm) {
        setDeleteConfirm(true)
        return
      }
      await updateSetting('deletion_queued_at', new Date().toISOString())
      setDeleteConfirm(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isDeletionQueued = !!settings.deletion_queued_at

  return (
    <div className="flex flex-col h-full items-center justify-start pt-4 pb-8 overflow-y-auto">
      <div className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        
        <div className="bg-muted/30 p-6 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Settings</h2>
              <p className="text-sm text-muted-foreground">Preferences, privacy, and account control.</p>
            </div>
          </div>
          {saving && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>

        <div className="p-6 md:p-8 space-y-10">
          
          {/* App Appearance */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Appearance</h3>
            <div className="grid grid-cols-3 gap-3">
              <button 
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${theme === 'light' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border bg-background hover:bg-muted text-muted-foreground'}`}
                onClick={() => setTheme('light')}
              >
                <Sun className="h-5 w-5" />
                <span className="text-sm">Light</span>
              </button>
              <button 
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${theme === 'dark' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border bg-background hover:bg-muted text-muted-foreground'}`}
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-5 w-5" />
                <span className="text-sm">Dark</span>
              </button>
              <button 
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${theme === 'system' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border bg-background hover:bg-muted text-muted-foreground'}`}
                onClick={() => setTheme('system')}
              >
                <Monitor className="h-5 w-5" />
                <span className="text-sm">System</span>
              </button>
            </div>
          </section>

          {/* Discovery & Privacy */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Discovery & Privacy</h3>
            
            {/* Visibility Toggle */}
            <div className="flex items-start justify-between p-4 rounded-xl border border-border bg-background">
              <div className="pr-4">
                <div className="flex items-center gap-2">
                  {settings.is_visible ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  <h4 className="font-semibold text-sm">Profile Visibility</h4>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {settings.is_visible 
                    ? "Your profile is currently visible to other students in the discovery pool." 
                    : "Your profile is hidden. You will not be shown to new people, but existing matches remain."}
                </p>
              </div>
              <Button 
                variant={settings.is_visible ? "outline" : "default"}
                className={`rounded-xl flex-shrink-0 ${!settings.is_visible && "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                onClick={() => updateSetting('is_visible', !settings.is_visible)}
              >
                {settings.is_visible ? "Hide Profile" : "Go Visible"}
              </Button>
            </div>

            {/* Hookup Opt-In Toggle */}
            <div className={`flex items-start justify-between p-4 rounded-xl border transition-all ${settings.hookup_opt_in ? 'border-orange-500/50 bg-orange-500/5' : 'border-border bg-background'}`}>
              <div className="pr-4">
                <div className="flex items-center gap-2">
                  <Flame className={`h-4 w-4 ${settings.hookup_opt_in ? 'text-orange-500' : 'text-muted-foreground'}`} />
                  <h4 className="font-semibold text-sm">Casual / Hookup Intent</h4>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Strictly mutual opt-in. If enabled, you will see others looking for casual encounters, and they will see you. 
                  <span className="block mt-1 font-medium text-orange-500/80">Can only be toggled once every 24 hours.</span>
                </p>
              </div>
              <button 
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${settings.hookup_opt_in ? 'bg-orange-500' : 'bg-muted-foreground/30'}`}
                onClick={() => updateSetting('hookup_opt_in', !settings.hookup_opt_in)}
                role="switch"
                aria-checked={settings.hookup_opt_in}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.hookup_opt_in ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </section>

          {/* Account Control */}
          <section className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-bold uppercase tracking-wider text-destructive">Danger Zone</h3>
            
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl border ${isDeletionQueued ? 'border-destructive bg-destructive/10' : 'border-destructive/30 bg-destructive/5'} gap-4`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-destructive">
                    {isDeletionQueued ? "Account Scheduled for Deletion" : "Delete Account"}
                  </h4>
                  <p className="text-xs text-destructive/80 mt-1 max-w-sm leading-relaxed">
                    {isDeletionQueued 
                      ? `Your account is hidden and will be permanently deleted in 7 days. You can cancel this process.` 
                      : "Permanently delete your profile, matches, and messages. This action triggers a 7-day grace period."}
                  </p>
                </div>
              </div>
              
              {isDeletionQueued ? (
                <Button 
                  onClick={handleAccountAction}
                  className="w-full sm:w-auto rounded-xl bg-background text-foreground hover:bg-muted"
                >
                  Cancel Deletion
                </Button>
              ) : (
                <div className="w-full sm:w-auto flex flex-col gap-2">
                  {deleteConfirm && (
                    <span className="text-[10px] text-destructive font-bold uppercase tracking-wider text-center">Are you sure?</span>
                  )}
                  <Button 
                    variant="destructive" 
                    onClick={handleAccountAction}
                    className={`w-full rounded-xl transition-all ${deleteConfirm ? 'ring-2 ring-destructive ring-offset-2 ring-offset-background' : ''}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteConfirm ? "Confirm Deletion" : "Delete Account"}
                  </Button>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast px-5 py-3 rounded-2xl shadow-xl text-sm font-medium ${
          toast.type === "success" 
            ? "bg-primary text-primary-foreground" 
            : toast.type === "error"
            ? "bg-destructive text-white"
            : "bg-card border border-border text-foreground"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
