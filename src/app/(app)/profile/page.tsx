/* eslint-disable */
"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, Plus, X, User } from "lucide-react"

type Profile = {
  id: string
  real_name: string
  department: string
  year: string
  gender: string
  bio: string | null
  relationship_intent: string
  relationship_intents: string[]
  avatar_url: string | null
  interest_tags: string[] | null
}

const COMMON_TAGS = ["Anime", "Gym", "Coding", "Music", "Photography", "Gaming", "Sports", "Art", "Travel"]

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [toast, setToast] = useState<{msg: string, type: "success" | "error"} | null>(null)
  
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) throw error
      const intents: string[] =
        data.relationship_intents && data.relationship_intents.length > 0
          ? data.relationship_intents
          : data.relationship_intent
          ? [data.relationship_intent]
          : ["friendship"]
      setProfile({ ...data, interest_tags: data.interest_tags || [], relationship_intents: intents })
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!profile) return

    setSaving(true)
    try {
      const basePayload = {
        real_name: profile.real_name,
        department: profile.department,
        year: profile.year,
        gender: profile.gender,
        bio: profile.bio,
        relationship_intent: profile.relationship_intents[0] ?? "friendship",
        interest_tags: profile.interest_tags,
      }

      // Try saving with the new array column first. If the column doesn't exist
      // yet (migration not run), fall back to the legacy single-value column.
      let { error } = await supabase
        .from("profiles")
        .update({ ...basePayload, relationship_intents: profile.relationship_intents })
        .eq("id", profile.id)

      if (error) {
        const msg: string = (error as any).message ?? JSON.stringify(error)
        // Column doesn't exist yet → retry without it
        if (msg.includes("relationship_intents") || msg.includes("column")) {
          const fallback = await supabase
            .from("profiles")
            .update(basePayload)
            .eq("id", profile.id)
          if (fallback.error) throw fallback.error
        } else {
          throw error
        }
      }

      showToast("Profile updated successfully!")
    } catch (err: any) {
      const msg: string = err?.message ?? err?.details ?? JSON.stringify(err)
      console.error("Error updating profile:", msg, err)
      showToast("Failed to update profile: " + (msg || "unknown error"), "error")
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!e.target.files || e.target.files.length === 0 || !profile) return

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: publicUrl })
      showToast("Profile photo updated!")
    } catch (error: any) {
      showToast(error.message || "Failed to upload image.", "error")
    } finally {
      setUploading(false)
    }
  }

  const addTag = (tag: string) => {
    if (!profile) return
    const t = tag.trim().substring(0, 20)
    if (!t || (profile.interest_tags && profile.interest_tags.includes(t))) return
    if (profile.interest_tags && profile.interest_tags.length >= 5) {
      showToast("Maximum 5 tags allowed.", "error")
      return
    }
    setProfile({ ...profile, interest_tags: [...(profile.interest_tags || []), t] })
    setNewTag("")
  }

  const removeTag = (tagToRemove: string) => {
    if (!profile) return
    setProfile({
      ...profile,
      interest_tags: (profile.interest_tags || []).filter(t => t !== tagToRemove)
    })
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) return <div className="p-8 text-center text-muted-foreground">Failed to load profile.</div>

  const displayAvatar = profile.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${profile.id}&backgroundColor=ffd700`

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="flex-1 p-6">
      <div className="w-full max-w-2xl mx-auto rounded-2xl border border-border overflow-hidden">
        
        {/* Header */}
        <div className="bg-muted/30 p-6 border-b border-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Edit Profile</h2>
            <p className="text-sm text-muted-foreground">Manage your campus identity and how others see you.</p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative group">
              <div className="h-36 w-36 rounded-full overflow-hidden border-4 border-background shadow-xl bg-muted">
                {uploading ? (
                  <div className="h-full w-full flex items-center justify-center bg-muted/80">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <img 
                    src={displayAvatar} 
                    alt="Profile Avatar" 
                    className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300"
                  />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 bg-primary text-primary-foreground p-2.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                disabled={uploading}
                title="Change photo"
              >
                <Camera className="h-5 w-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-4 font-medium">Use a real photo to get more matches</p>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSave} className="space-y-8">
            {/* Basics */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Basics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Real Name</label>
                  <input 
                    type="text" 
                    required
                    value={profile.real_name} 
                    onChange={e => setProfile({...profile, real_name: e.target.value})}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Gender</label>
                  <select 
                    required
                    value={profile.gender}
                    onChange={e => setProfile({...profile, gender: e.target.value})}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Academics */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Academics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Department</label>
                  <input 
                    type="text" 
                    required
                    value={profile.department} 
                    onChange={e => setProfile({...profile, department: e.target.value})}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Year of Study</label>
                  <select 
                    required
                    value={profile.year}
                    onChange={e => setProfile({...profile, year: e.target.value})}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  >
                    <option value="">Select...</option>
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* About You */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">About You</h3>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Bio</label>
                <textarea 
                  rows={4}
                  value={profile.bio || ""} 
                  onChange={e => setProfile({...profile, bio: e.target.value})}
                  placeholder="Tell everyone a bit about yourself..."
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex justify-between">
                  <span>Interests (Max 5)</span>
                  <span className="text-xs font-normal text-muted-foreground">{(profile.interest_tags || []).length}/5</span>
                </label>
                
                {/* Active Tags */}
                {(profile.interest_tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.interest_tags!.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/25 px-3 py-1 rounded-full text-sm font-semibold">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-primary/60 hover:text-destructive transition-colors ml-0.5">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(newTag); } }}
                    placeholder="Add an interest (e.g. Hiking)"
                    className="flex-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none"
                    disabled={(profile.interest_tags || []).length >= 5}
                    maxLength={20}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="rounded-xl px-3" 
                    onClick={() => addTag(newTag)}
                    disabled={!newTag.trim() || (profile.interest_tags || []).length >= 5}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Quick add tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COMMON_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      disabled={(profile.interest_tags || []).includes(tag) || (profile.interest_tags || []).length >= 5}
                      className="text-xs bg-primary/5 text-primary/70 border border-primary/15 hover:bg-primary/10 hover:text-primary hover:border-primary/30 disabled:opacity-40 px-2.5 py-1 rounded-full transition-all duration-150 font-medium"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-semibold block">Relationship Intent</label>
                <p className="text-[11px] text-muted-foreground">Select all that apply — at least one required.</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {([
                    { value: "friendship", emoji: "🤝", label: "Friendship" },
                    { value: "dating",     emoji: "💛", label: "Dating" },
                    { value: "casual",     emoji: "🔥", label: "Casual" },
                  ] as const).map(({ value, emoji, label }) => {
                    const selected = profile.relationship_intents.includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          const current = profile.relationship_intents
                          if (selected) {
                            if (current.length <= 1) return // enforce at least one
                            setProfile({ ...profile, relationship_intents: current.filter(i => i !== value) })
                          } else {
                            setProfile({ ...profile, relationship_intents: [...current, value] })
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all duration-150 ${
                          selected
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        <span>{emoji}</span>
                        {label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 bg-muted/50 p-2 rounded-lg">
                  Note: If you select Casual, you still need to explicitly opt-in to hookup visibility in <a href="/settings" className="underline text-primary">Settings</a> for it to take effect.
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6 border-t border-border flex justify-end">
              <Button type="submit" className="rounded-xl px-8 w-full sm:w-auto" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Profile
              </Button>
            </div>
          </form>
        </div>
      </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-toast px-5 py-3 rounded-2xl shadow-xl text-sm font-medium ${
          toast.type === "success" 
            ? "bg-primary text-primary-foreground" 
            : "bg-destructive text-white"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
