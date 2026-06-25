/* eslint-disable */
"use client"

import { useEffect, useState, useRef, type CSSProperties } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { MotionModal } from "@/components/MotionModal"
import { Loader2 } from "lucide-react"
import { isValidUsername, normalizeUsername, usernameGuidance } from "@/lib/username"
import Cropper from "react-easy-crop"
import getCroppedImg from "@/lib/cropImage"
import {
  DEFAULT_DISCLOSURE_HABIT,
  DEFAULT_FOOD_HABIT,
  DRINKING_HABIT_OPTIONS,
  FOOD_HABIT_OPTIONS,
  INTEREST_TAGS,
  RELATIONSHIP_INTENTS,
  SMOKING_HABIT_OPTIONS,
  normalizeRelationshipIntents,
} from "@/lib/profile-options"

type Profile = {
  id: string
  username: string
  real_name: string
  department: string
  year: string
  gender: string
  bio: string | null
  relationship_intent: string
  relationship_intents: string[]
  avatar_url: string | null
  photos: string[]
  interest_tags: string[] | null
  food_preference: string | null
  drinking_habit: string | null
  smoking_habit: string | null
}

const COMMON_TAGS = INTEREST_TAGS.slice(0, 9)

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [toast, setToast] = useState<{msg: string, type: "success" | "error"} | null>(null)
  
  // Cropper State
  const [targetPhotoIndex, setTargetPhotoIndex] = useState<number>(-1)
  const [photoToCrop, setPhotoToCrop] = useState<{ url: string; index: number; file: File } | null>(null)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  
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
      const intents = normalizeRelationshipIntents(data.relationship_intents, data.relationship_intent)
      setProfile({ 
        ...data, 
        username: data.username || "", 
        interest_tags: data.interest_tags || [], 
        relationship_intents: intents,
        food_preference: data.food_preference || DEFAULT_FOOD_HABIT,
        drinking_habit: data.drinking_habit || DEFAULT_DISCLOSURE_HABIT,
        smoking_habit: data.smoking_habit || DEFAULT_DISCLOSURE_HABIT,
        photos: data.photos || []
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!profile) return

    const normalizedUsername = normalizeUsername(profile.username)
    if (!isValidUsername(normalizedUsername)) {
      showToast(usernameGuidance(normalizedUsername) || "Enter a valid username.", "error")
      return
    }

    setSaving(true)
    try {
      const { data: usernameOwner, error: usernameCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", normalizedUsername)
        .neq("id", profile.id)
        .maybeSingle()

      if (usernameCheckError) throw usernameCheckError
      if (usernameOwner) {
        showToast("That username is already taken.", "error")
        setSaving(false)
        return
      }

      const relationshipIntents = normalizeRelationshipIntents(profile.relationship_intents, profile.relationship_intent)
      const basePayload = {
        username: normalizedUsername,
        real_name: profile.real_name,
        department: profile.department,
        year: profile.year,
        gender: profile.gender,
        bio: profile.bio,
        relationship_intent: relationshipIntents[0] ?? "friendship",
        relationship_intents: relationshipIntents,
        interest_tags: profile.interest_tags,
        food_preference: profile.food_preference || DEFAULT_FOOD_HABIT,
        drinking_habit: profile.drinking_habit || DEFAULT_DISCLOSURE_HABIT,
        smoking_habit: profile.smoking_habit || DEFAULT_DISCLOSURE_HABIT,
      }

      let { error } = await supabase
        .from("profiles")
        .update(basePayload)
        .eq("id", profile.id)

      if (error) {
        const msg: string = (error as any).message ?? JSON.stringify(error)
        if (msg.includes("relationship_intents") || msg.includes("column")) {
          const { relationship_intents, food_preference, drinking_habit, smoking_habit, ...legacyPayload } = basePayload
          const fallback = await supabase
            .from("profiles")
            .update(legacyPayload)
            .eq("id", profile.id)
          if (fallback.error) throw fallback.error
        } else {
          throw error
        }
      }

      setProfile({ ...profile, username: normalizedUsername, relationship_intents: relationshipIntents })
      showToast("Profile updated successfully!")
    } catch (err: any) {
      const msg: string = err?.message ?? err?.details ?? JSON.stringify(err)
      console.error("Error updating profile:", msg, err)
      showToast("Failed to update profile: " + (msg || "unknown error"), "error")
    } finally {
      setSaving(false)
    }
  }

  const triggerFileInput = (index: number) => {
    setTargetPhotoIndex(index)
    fileInputRef.current?.click()
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    const url = URL.createObjectURL(file)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setPhotoToCrop({ url, file, index: targetPhotoIndex })
    setCropperOpen(true)
    e.target.value = "" // reset
  }

  const closeCropper = () => {
    setCropperOpen(false)
    window.setTimeout(() => setPhotoToCrop(null), 180)
  }

  const handleCropSave = async () => {
    if (!photoToCrop || !croppedAreaPixels || !profile) return
    setUploading(true)
    try {
      const croppedBlob = await getCroppedImg(photoToCrop.url, croppedAreaPixels)
      if (!croppedBlob) throw new Error("Failed to crop image")

      const fileExt = photoToCrop.file.name.split('.').pop() || "jpg"
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      if (photoToCrop.index === -1) {
        // DP
        await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id)
        setProfile({ ...profile, avatar_url: publicUrl })
      } else {
        // Additional Photo
        const newPhotos = [...(profile.photos || [])]
        // If replacing, overwrite. If adding to the end, it will naturally append.
        if (photoToCrop.index >= newPhotos.length) {
          newPhotos.push(publicUrl)
        } else {
          newPhotos[photoToCrop.index] = publicUrl
        }
        await supabase.from("profiles").update({ photos: newPhotos }).eq("id", profile.id)
        setProfile({ ...profile, photos: newPhotos })
      }

      showToast("Photo updated successfully!")
      closeCropper()
    } catch (err: any) {
      showToast(err.message || "Failed to upload", "error")
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = async (index: number) => {
    if (!profile) return
    const newPhotos = [...(profile.photos || [])]
    newPhotos.splice(index, 1)
    await supabase.from("profiles").update({ photos: newPhotos }).eq("id", profile.id)
    setProfile({ ...profile, photos: newPhotos })
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
  const zoomProgress = ((zoom - 1) / 2) * 100
  const zoomSliderStyle = { "--zoom-progress": `${zoomProgress}%` } as CSSProperties

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto relative">
      <div className="flex-1 p-6 md:p-12">
        <div className="w-full max-w-2xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Edit Profile</h2>
              <p className="text-sm text-muted-foreground pt-2">Manage your identity and how others see you.</p>
            </div>
          </div>

          <div className="pt-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageSelect}
              disabled={uploading}
            />

            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative group">
                <div className="h-36 w-36 rounded-full overflow-hidden border-4 border-background shadow-xl bg-muted">
                  {uploading && photoToCrop?.index === -1 ? (
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
                  onClick={() => triggerFileInput(-1)}
                  className="absolute bottom-1 right-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  disabled={uploading}
                  title="Change photo"
                >
                  Change
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-4 font-medium">Main Profile Photo (DP)</p>
            </div>

            {/* Additional Photos */}
            <div className="space-y-4 mb-10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Additional Photos (Up to 5)</h3>
              <p className="text-xs text-muted-foreground mb-3">Add more flavor to your profile. These will appear in your Discover carousel.</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {[0, 1, 2, 3, 4].map((index) => {
                  const photoUrl = profile.photos[index]
                  return (
                    <div key={index} className="aspect-[4/5] relative rounded-xl border-2 border-dashed border-border/60 bg-muted/20 overflow-hidden group hover:bg-muted/40 transition-colors">
                      {photoUrl ? (
                        <>
                          <img src={photoUrl} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button 
                              type="button"
                              onClick={() => triggerFileInput(index)} 
                              className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/40"
                              title="Replace"
                            >
                              Replace
                            </button>
                            <button 
                              type="button"
                              onClick={() => removePhoto(index)} 
                              className="rounded-full bg-destructive/80 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-destructive"
                              title="Remove"
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => triggerFileInput(profile.photos.length)} 
                          className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                          disabled={index > profile.photos.length} // Force them to fill sequentially
                        >
                          <span className="text-xs font-semibold">Add</span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSave} className="space-y-8">
              {/* Basics */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Basics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Username</label>
                    <div className="flex rounded-xl border border-input bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                      <span className="flex items-center pl-4 text-sm text-muted-foreground">@</span>
                      <input
                        type="text"
                        required
                        value={profile.username}
                        onChange={e => setProfile({...profile, username: normalizeUsername(e.target.value)})}
                        className="w-full rounded-xl bg-transparent px-1 py-2.5 pr-4 text-sm focus:outline-none"
                        minLength={3}
                        maxLength={20}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Used for sign-in and confessions.</p>
                  </div>
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Academics</h3>
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">About You</h3>
                
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

                <div className="space-y-3">
                  <label className="text-sm font-semibold block">Food & Habits</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Food
                      </label>
                      <select
                        value={profile.food_preference || DEFAULT_FOOD_HABIT}
                        onChange={e => setProfile({...profile, food_preference: e.target.value})}
                        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                      >
                        {FOOD_HABIT_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Drinking
                      </label>
                      <select
                        value={profile.drinking_habit || DEFAULT_DISCLOSURE_HABIT}
                        onChange={e => setProfile({...profile, drinking_habit: e.target.value})}
                        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                      >
                        {DRINKING_HABIT_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Smoking
                      </label>
                      <select
                        value={profile.smoking_habit || DEFAULT_DISCLOSURE_HABIT}
                        onChange={e => setProfile({...profile, smoking_habit: e.target.value})}
                        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                      >
                        {SMOKING_HABIT_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
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
                            <span aria-hidden="true">x</span>
                            <span className="sr-only">Remove {tag}</span>
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
                      Add
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
                  <p className="text-[11px] text-muted-foreground">Select all that apply - at least one required.</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {RELATIONSHIP_INTENTS.map(({ value, label }) => {
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
                          {label}
                        </button>
                      )
                    })}
                  </div>
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

      {/* Cropper Modal */}
      <MotionModal
        open={cropperOpen && !!photoToCrop}
        className="z-[100] bg-black/80"
        panelClassName="bg-background w-full max-w-lg rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        labelledBy="crop-photo-title"
      >
        {photoToCrop && (
          <>
            <div className="p-4 border-b border-border flex justify-between items-center bg-card">
              <h3 id="crop-photo-title" className="font-bold text-lg">Crop Photo</h3>
              <button 
                onClick={closeCropper}
                className="p-1 rounded-full hover:bg-muted transition-colors"
                disabled={uploading}
              >
                <span aria-hidden="true">x</span>
                <span className="sr-only">Close</span>
              </button>
            </div>
            <div className="relative h-[60vh] w-full bg-black/90">
              <Cropper
                image={photoToCrop.url}
                crop={crop}
                zoom={zoom}
                minZoom={1}
                maxZoom={3}
                aspect={4 / 5}
                onCropChange={setCrop}
                onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                onZoomChange={setZoom}
              />
            </div>
            <div className="space-y-2 bg-card px-4 py-4 border-t border-border">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <label htmlFor="crop-zoom">Zoom</label>
                <span>{zoom.toFixed(1)}x</span>
              </div>
              <input
                id="crop-zoom"
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="zoom-slider w-full"
                style={zoomSliderStyle}
                aria-label="Photo crop zoom"
              />
            </div>
            <div className="p-4 flex justify-end gap-3 bg-card border-t border-border">
              <Button variant="outline" onClick={closeCropper} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleCropSave} disabled={uploading}>
                {uploading ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : null}
                Save Photo
              </Button>
            </div>
          </>
        )}
      </MotionModal>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] animate-toast px-5 py-3 rounded-2xl shadow-xl text-sm font-medium ${
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
