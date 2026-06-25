/* eslint-disable */
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { AnimatedSwitch } from "@/components/AnimatedSwitch"
import { Button } from "@/components/ui/button"
import {
  Loader2, AlertTriangle, Shield,
  EyeOff, Eye, Trash2, KeyRound, Lock, Tags, BookOpen, GraduationCap
} from "lucide-react"
import { DEPARTMENTS, DOESNT_MATTER, INTEREST_TAGS, YEARS } from "@/lib/profile-options"

type ProfileSettings = {
  id: string
  is_visible: boolean
  deletion_queued_at: string | null
  has_password: boolean
  interested_interests: string[] | null
  interested_departments: string[] | null
  interested_years: string[] | null
  read_receipts_enabled: boolean
}

type PreferenceKey = "interested_interests" | "interested_departments" | "interested_years"

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
        .select("id, is_visible, deletion_queued_at, has_password, interested_interests, interested_departments, interested_years, read_receipts_enabled")
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

    const updates: any = { [key]: value }

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

  const togglePreference = (key: PreferenceKey, value: string) => {
    if (!settings) return
    const current = settings[key] || []
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]
    updateSetting(key, next)
  }

  const setPreferenceDoesntMatter = (key: PreferenceKey) => {
    updateSetting(key, [])
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
                  <AnimatedSwitch
                    checked={settings.is_visible}
                    onCheckedChange={(checked) => updateSetting("is_visible", checked)}
                    ariaLabel="Toggle profile visibility"
                    checkedLabel="Visible"
                    uncheckedLabel="Hidden"
                    disabled={saving}
                  />
                </div>

                <div className="flex items-start justify-between gap-4 border-t border-border/50 pt-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold">Read Receipts</h4>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      When disabled, people can see that messages were delivered but not when you read them.
                    </p>
                  </div>
                  <AnimatedSwitch
                    checked={settings.read_receipts_enabled}
                    onCheckedChange={(checked) => updateSetting("read_receipts_enabled", checked)}
                    ariaLabel="Toggle read receipts"
                    checkedLabel="On"
                    uncheckedLabel="Off"
                    disabled={saving}
                  />
                </div>

              </section>

              {/* Interested In */}
              <section className="space-y-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Interested In</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Tags className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-sm">Interests</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPreferenceDoesntMatter("interested_interests")}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                          (settings.interested_interests || []).length === 0
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {DOESNT_MATTER}
                      </button>
                      {INTEREST_TAGS.map((interest) => {
                        const selected = (settings.interested_interests || []).includes(interest)
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => togglePreference("interested_interests", interest)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                              selected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            }`}
                          >
                            {interest}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-sm">Branches</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPreferenceDoesntMatter("interested_departments")}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                          (settings.interested_departments || []).length === 0
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {DOESNT_MATTER}
                      </button>
                      {DEPARTMENTS.map((department) => {
                        const selected = (settings.interested_departments || []).includes(department)
                        return (
                          <button
                            key={department}
                            type="button"
                            onClick={() => togglePreference("interested_departments", department)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                              selected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            }`}
                          >
                            {department}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-sm">Years</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPreferenceDoesntMatter("interested_years")}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                          (settings.interested_years || []).length === 0
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {DOESNT_MATTER}
                      </button>
                      {YEARS.map((year) => {
                        const selected = (settings.interested_years || []).includes(year)
                        return (
                          <button
                            key={year}
                            type="button"
                            onClick={() => togglePreference("interested_years", year)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                              selected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            }`}
                          >
                            {year} Year
                          </button>
                        )
                      })}
                    </div>
                  </div>
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
