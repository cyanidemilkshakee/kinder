/* eslint-disable */
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import {
  Loader2, AlertTriangle, Shield,
  EyeOff, Eye, Flame, Trash2, KeyRound, Lock
} from "lucide-react"

type ProfileSettings = {
  id: string
  is_visible: boolean
  hookup_opt_in: boolean
  hookup_opt_in_changed_at: string | null
  deletion_queued_at: string | null
  date_of_birth: string | null
  has_password: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ProfileSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [toast, setToast] = useState<{msg: string, type: "success" | "error" | "info"} | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

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
        .select("id, is_visible, hookup_opt_in, hookup_opt_in_changed_at, deletion_queued_at, date_of_birth, has_password")
        .eq("id", user.id)
        .single()

      if (error) throw error
      setSettings(data)
    } catch (error: any) {
      console.error("Error fetching settings:", error?.message ?? error)
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

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return

    if (settings.has_password && !currentPassword.trim()) {
      showToast("Enter your current password first.", "error")
      return
    }

    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters.", "error")
      return
    }

    if (newPassword !== confirmPassword) {
      showToast("New password and confirmation do not match.", "error")
      return
    }

    setPasswordSaving(true)
    try {
      const payload: { password: string; current_password?: string } = {
        password: newPassword,
      }

      if (settings.has_password) {
        payload.current_password = currentPassword
      }

      const { error: authError } = await supabase.auth.updateUser(payload)
      if (authError) throw authError

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ has_password: true })
        .eq("id", settings.id)

      if (profileError) throw profileError

      setSettings({ ...settings, has_password: true })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      showToast(settings.has_password ? "Password changed successfully." : "Password set up successfully.", "success")
    } catch (error: any) {
      const message = error?.message || "Unable to update password."
      showToast(message, "error")
    } finally {
      setPasswordSaving(false)
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

  // Calculate age for minor check
  let isMinor = false
  if (settings.date_of_birth) {
    const dob = new Date(settings.date_of_birth)
    const ageDiffMs = Date.now() - dob.getTime()
    const ageDate = new Date(ageDiffMs)
    isMinor = Math.abs(ageDate.getUTCFullYear() - 1970) < 18
  }


  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="flex-1 p-6 md:p-12">
        <div className="w-full max-w-2xl text-left space-y-5">

          {/* Page header */}
          <div className="space-y-6 pb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Shield className="h-10 w-10 text-primary mb-2" />
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Settings</h2>
                  <p className="text-sm text-muted-foreground">Preferences, privacy, and account control.</p>
                </div>
              </div>
              {(saving || passwordSaving) && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </div>

            <div className="space-y-10 pt-4">

              {/* Account Security */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Account Security</h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={settings.has_password}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                      !settings.has_password
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/40 text-muted-foreground opacity-60"
                    }`}
                  >
                    <KeyRound className="h-5 w-5 flex-shrink-0 text-primary" />
                    <span>
                      <span className="block text-sm font-semibold">Set Up Password</span>
                      <span className="block text-xs text-muted-foreground">Available for OAuth-only accounts.</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={!settings.has_password}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                      settings.has_password
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/40 text-muted-foreground opacity-60"
                    }`}
                  >
                    <Lock className="h-5 w-5 flex-shrink-0 text-primary" />
                    <span>
                      <span className="block text-sm font-semibold">Change Password</span>
                      <span className="block text-xs text-muted-foreground">Available once a password exists.</span>
                    </span>
                  </button>
                </div>

                <form onSubmit={handlePasswordUpdate} className="space-y-3">
                  {settings.has_password && (
                    <div className="space-y-1.5">
                      <label htmlFor="current-password" className="text-sm font-semibold">Current Password</label>
                      <input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        autoComplete="current-password"
                      />
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="new-password" className="text-sm font-semibold">New Password</label>
                      <input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        autoComplete="new-password"
                        minLength={8}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="confirm-password" className="text-sm font-semibold">Confirm Password</label>
                      <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        autoComplete="new-password"
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="w-full rounded-xl sm:w-auto"
                      disabled={passwordSaving || !newPassword || !confirmPassword || (settings.has_password && !currentPassword)}
                    >
                      {passwordSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {settings.has_password ? "Change Password" : "Set Up Password"}
                    </Button>
                  </div>
                </form>
              </section>

              {/* Discovery & Privacy */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Discovery & Privacy</h3>

                {/* Visibility Toggle */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {settings.is_visible
                        ? <Eye className="h-4 w-4 text-green-500 flex-shrink-0" />
                        : <EyeOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      <h4 className="font-semibold text-sm">Profile Visibility</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
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
                <div className={`flex items-start justify-between transition-all gap-4 ${isMinor ? 'opacity-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className={`h-4 w-4 flex-shrink-0 ${settings.hookup_opt_in ? 'text-orange-500' : 'text-muted-foreground'}`} />
                      <h4 className="font-semibold text-sm">Casual / Hookup Intent</h4>
                      {isMinor && <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold uppercase">Restricted</span>}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Strictly mutual opt-in. If enabled, you will see others looking for casual encounters, and they will see you.
                      {!isMinor && <span className="block mt-1 font-medium text-orange-500/80">Can only be toggled once every 24 hours.</span>}
                      {isMinor && <span className="block mt-1 font-medium text-destructive">Must be 18+ to enable this feature.</span>}
                    </p>
                  </div>
                  <button
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 mt-0.5 ${settings.hookup_opt_in ? 'bg-orange-500' : 'bg-muted-foreground/30'} ${isMinor ? 'cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (isMinor) return
                      updateSetting('hookup_opt_in', !settings.hookup_opt_in)
                    }}
                    disabled={isMinor}
                    role="switch"
                    aria-checked={settings.hookup_opt_in}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.hookup_opt_in ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </section>

            </div>
          </div>


          {/* Danger Zone */}
          <div className="space-y-4 pt-6 pb-12">
            <h3 className="text-sm font-bold uppercase tracking-wider text-destructive border-b border-destructive/20 pb-2">Danger Zone</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-base text-destructive">
                    {isDeletionQueued ? "Account Scheduled for Deletion" : "Delete Account"}
                  </h4>
                  <p className="text-sm text-destructive/80 mt-1 max-w-sm leading-relaxed">
                    {isDeletionQueued
                      ? `Your account is hidden and will be permanently deleted in 7 days. You can cancel this process.`
                      : "Permanently delete your profile, matches, and messages. This action triggers a 7-day grace period."}
                  </p>
                </div>
              </div>

              {isDeletionQueued ? (
                <Button
                  onClick={handleAccountAction}
                  className="w-full sm:w-auto rounded-xl"
                  variant="outline"
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
          </div>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast px-5 py-3 rounded-2xl shadow-xl text-sm font-medium ${
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
