/* eslint-disable */
"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, User, BookOpen, Sparkles, ChevronRight, Image as ImageIcon, Tags, Upload, Utensils, Camera, X, Plus } from "lucide-react"
import { isValidUsername, normalizeUsername, usernameGuidance } from "@/lib/username"
import {
  DEFAULT_DISCLOSURE_HABIT,
  DEFAULT_FOOD_HABIT,
  DEPARTMENTS,
  DRINKING_HABIT_OPTIONS,
  FOOD_HABIT_OPTIONS,
  INTEREST_TAGS,
  RELATIONSHIP_INTENTS,
  SMOKING_HABIT_OPTIONS,
} from "@/lib/profile-options"

const STEPS = [
  { id: 1, title: "Who are you?", icon: User, desc: "Tell us your name and identity" },
  { id: 2, title: "Your Photo", icon: ImageIcon, desc: "Upload a real profile picture" },
  { id: 3, title: "Your studies", icon: BookOpen, desc: "Department and year of study" },
  { id: 4, title: "What you seek", icon: Sparkles, desc: "Your intent and preferences" },
  { id: 5, title: "Lifestyle & Interests", icon: Tags, desc: "Habits and what you're into" },
  { id: 6, title: "More Photos", icon: Camera, desc: "Add up to 5 photos to your profile" },
]

const GENDER_PREFS = ["Male", "Female", "Non-binary", "Any"]

// Helper: Checkbox indicator
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div className={`h-4 w-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
      checked ? "border-primary bg-primary" : "border-muted-foreground"
    }`}>
      {checked && (
        <svg className="h-2.5 w-2.5 text-primary-foreground" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)

  // Step 1
  const [username, setUsername] = useState("")
  const [realName, setRealName] = useState("")
  const [gender, setGender] = useState("")
  const [dob, setDob] = useState("")
  const [bio, setBio] = useState("")

  // Step 2
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 3
  const [department, setDepartment] = useState("")
  const [year, setYear] = useState("")

  // Step 4
  const [relationshipIntents, setRelationshipIntents] = useState<string[]>(["friendship"])
  // gender preference per intent: { friendship: "Any", dating: "Female", ... }
  const [genderPrefs, setGenderPrefs] = useState<Record<string, string>>({})

  // Step 5 – habits
  const [foodPreference, setFoodPreference] = useState(DEFAULT_FOOD_HABIT)
  const [drinkingHabit, setDrinkingHabit] = useState(DEFAULT_DISCLOSURE_HABIT)
  const [smokingHabit, setSmokingHabit] = useState(DEFAULT_DISCLOSURE_HABIT)
  // Step 5 – interests
  const [interestTags, setInterestTags] = useState<string[]>([])
  const [preferredInterests, setPreferredInterests] = useState<string[]>([])

  // Step 6 – extra photos (up to 5)
  const [photoFiles, setPhotoFiles] = useState<(File | null)[]>([null, null, null, null, null])
  const [photoPreviews, setPhotoPreviews] = useState<(string | null)[]>([null, null, null, null, null])
  const photoInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const hydrateExistingProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("profiles")
        .select("username, real_name")
        .eq("id", user.id)
        .maybeSingle()

      const existingUsername = data?.username || user.user_metadata?.username || ""
      const existingName = data?.real_name || user.user_metadata?.full_name || ""

      if (existingUsername) setUsername(normalizeUsername(existingUsername))
      if (existingName) setRealName(existingName)
    }

    hydrateExistingProfile()
  }, [])

  const canGoNext = () => {
    if (step === 1) return isValidUsername(username) && realName.trim().length >= 2 && gender !== "" && dob !== ""
    if (step === 2) return avatarFile !== null
    if (step === 3) return department !== "" && year !== ""
    if (step === 4) return relationshipIntents.length > 0 && relationshipIntents.every(i => !!genderPrefs[i])
    if (step === 5) return foodPreference !== "" && drinkingHabit !== "" && smokingHabit !== "" && interestTags.length >= 3
    if (step === 6) return true // photos optional
    return true
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be smaller than 5MB")
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
      setError("")
    }
  }

  const handlePhotoSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be smaller than 5MB")
        return
      }
      const newFiles = [...photoFiles]
      const newPreviews = [...photoPreviews]
      newFiles[index] = file
      newPreviews[index] = URL.createObjectURL(file)
      setPhotoFiles(newFiles)
      setPhotoPreviews(newPreviews)
      setError("")
    }
  }

  const removePhoto = (index: number) => {
    const newFiles = [...photoFiles]
    const newPreviews = [...photoPreviews]
    newFiles[index] = null
    newPreviews[index] = null
    setPhotoFiles(newFiles)
    setPhotoPreviews(newPreviews)
  }

  const toggleTag = (tag: string, list: string[], setList: (v: string[]) => void, max = 5) => {
    if (list.includes(tag)) {
      setList(list.filter(t => t !== tag))
    } else {
      if (list.length >= max) {
        setError(`You can select a maximum of ${max} tags`)
        return
      }
      setError("")
      setList([...list, tag])
    }
  }

  const handleSubmit = async () => {
    setError("")
    setLoading(true)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      setError("Not authenticated")
      setLoading(false)
      router.push('/')
      return
    }

    const normalizedUsername = normalizeUsername(username)
    const hasAuthPassword = user.user_metadata?.has_password === true
    if (!isValidUsername(normalizedUsername)) {
      setError(usernameGuidance(normalizedUsername) || "Enter a valid username")
      setLoading(false)
      return
    }

    const { data: usernameOwner, error: usernameCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", normalizedUsername)
      .neq("id", user.id)
      .maybeSingle()

    if (usernameCheckError) {
      setError(usernameCheckError.message)
      setLoading(false)
      return
    }

    if (usernameOwner) {
      setError("That username is already taken.")
      setLoading(false)
      return
    }

    // Upload main avatar
    let avatarUrl = ""
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile)
      if (uploadError) {
        setError("Failed to upload avatar: " + uploadError.message)
        setLoading(false)
        return
      }
      avatarUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl
    }

    // Upload extra photos
    const photoUrls: string[] = []
    for (let i = 0; i < photoFiles.length; i++) {
      const f = photoFiles[i]
      if (!f) continue
      const ext = f.name.split('.').pop()
      const fname = `${user.id}/photo-${i}-${crypto.randomUUID()}.${ext}`
      const { error: pErr } = await supabase.storage.from('avatars').upload(fname, f)
      if (pErr) {
        setError("Failed to upload photo " + (i + 1) + ": " + pErr.message)
        setLoading(false)
        return
      }
      photoUrls.push(supabase.storage.from('avatars').getPublicUrl(fname).data.publicUrl)
    }

    const profilePayload = {
      username: normalizedUsername,
      real_name: realName,
      department,
      year,
      gender,
      bio,
      date_of_birth: dob,
      avatar_url: avatarUrl,
      relationship_intent: relationshipIntents[0] ?? "friendship",
      relationship_intents: relationshipIntents,
      gender_preferences: genderPrefs,
      interest_tags: interestTags,
      interested_interests: preferredInterests,
      food_preference: foodPreference,
      drinking_habit: drinkingHabit,
      smoking_habit: smokingHabit,
      has_password: hasAuthPassword,
      photos: photoUrls,
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(profilePayload)
      .eq('id', user.id)
      .select('id')
      .maybeSingle()

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    if (!updatedProfile) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          ...profilePayload,
        })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
    }

    router.push('/discover')
  }

  const StepIcon = STEPS[step - 1].icon

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">Kinder</h1>
          <p className="mt-1 text-sm text-muted-foreground">Set up your campus profile</p>
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  s.id < step
                    ? "bg-primary text-primary-foreground"
                    : s.id === step
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.id < step ? "✓" : s.id}
              </div>
              {s.id < STEPS.length && (
                <div className={`h-0.5 flex-1 transition-all duration-300 ${s.id < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-background/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <StepIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{STEPS[step - 1].title}</h2>
              <p className="text-sm text-muted-foreground">{STEPS[step - 1].desc}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Username</label>
                <div className="flex rounded-xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                  <span className="flex items-center pl-4 text-sm text-muted-foreground">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(normalizeUsername(e.target.value))}
                    placeholder="your_username"
                    className="block w-full rounded-xl bg-transparent px-1 py-2.5 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none"
                    minLength={3}
                    maxLength={20}
                  />
                </div>
                <p className="text-xs text-muted-foreground">People can find you and send confessions with this.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="e.g. Arjun Sharma"
                  className="block w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Gender</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Male", "Female", "Non-binary", "Other"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                        gender === g
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-input bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="block w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bio <span className="text-muted-foreground">(optional)</span></label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people a little about yourself…"
                  className="block w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Photo Upload */}
          {step === 2 && (
            <div className="space-y-4 flex flex-col items-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-40 h-40 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${
                  avatarPreview ? "border-primary" : "border-input hover:border-primary/50"
                }`}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground font-medium">Upload Photo</span>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarSelect}
                accept="image/*"
                className="hidden"
              />
              <p className="text-xs text-muted-foreground text-center mt-2 max-w-xs">
                Please upload a clear picture of yourself. Real photos build trust. Max 5MB.
              </p>
            </div>
          )}

          {/* Step 3: Academic */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Department</label>
                <div className="grid grid-cols-3 gap-2">
                  {DEPARTMENTS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDepartment(d)}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                        department === d
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-input bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Year of Study</label>
                <div className="grid grid-cols-4 gap-2">
                  {["1st", "2nd", "3rd", "4th"].map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(y)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        year === y
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-input bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Intent + Gender Preferences */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Select what you're looking for. You can change this anytime.
                </p>
                <div className="space-y-3">
                  {RELATIONSHIP_INTENTS.map((intent) => {
                    const selected = relationshipIntents.includes(intent.value)
                    return (
                      <div key={intent.value} className={`rounded-xl border transition-all ${
                        selected ? "border-primary bg-primary/5" : "border-input bg-background"
                      }`}>
                        {/* Intent toggle row */}
                        <button
                          type="button"
                          onClick={() => {
                            setRelationshipIntents(prev =>
                              prev.includes(intent.value)
                                ? prev.filter(v => v !== intent.value)
                                : [...prev, intent.value]
                            )
                          }}
                          className="w-full flex items-center gap-4 p-4 text-left"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{intent.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{intent.description}</div>
                          </div>
                          <Checkbox checked={selected} />
                        </button>

                        {/* Gender preference sub-section — only shows when intent selected */}
                        {selected && (
                          <div className="px-4 pb-4 border-t border-border/40 pt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              I'm interested in… <span className="text-destructive">*</span>
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {GENDER_PREFS.map((gp) => (
                                <button
                                  key={gp}
                                  type="button"
                                  onClick={() => setGenderPrefs(prev => ({ ...prev, [intent.value]: gp }))}
                                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                                    genderPrefs[intent.value] === gp
                                      ? "border-primary bg-primary/10 text-foreground"
                                      : "border-input bg-background text-muted-foreground hover:border-primary/50"
                                  }`}
                                >
                                  {gp === "Any" ? "No preference" : gp}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Habits + Interests */}
          {step === 5 && (
            <div className="space-y-6">
              {/* Habits */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your Lifestyle</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Food preference</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FOOD_HABIT_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFoodPreference(option)}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                            foodPreference === option
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-input bg-background text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Drinking</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DRINKING_HABIT_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setDrinkingHabit(option)}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                            drinkingHabit === option
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-input bg-background text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Smoking</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SMOKING_HABIT_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSmokingHabit(option)}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                            smokingHabit === option
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-input bg-background text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* My Interests */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">My Interests</h3>
                  <span className="text-xs font-semibold text-primary">{interestTags.length}/5</span>
                </div>
                <p className="text-xs text-muted-foreground">Select 3–5 tags that describe you.</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag, interestTags, setInterestTags, 5)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        interestTags.includes(tag)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Interests */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">I'd Love Them To Be Into…</h3>
                  <span className="text-xs font-semibold text-primary">{preferredInterests.length}/5</span>
                </div>
                <p className="text-xs text-muted-foreground">Optional — interests you prefer in your match. Up to 5.</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag, preferredInterests, setPreferredInterests, 5)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        preferredInterests.includes(tag)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Extra Photos */}
          {step === 6 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add up to 5 photos to show more of your personality. These appear on your profile. <span className="text-foreground font-medium">Optional</span> — you can skip this step.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {photoFiles.map((_, i) => (
                  <div key={i} className="relative aspect-square">
                    {photoPreviews[i] ? (
                      <>
                        <img
                          src={photoPreviews[i]!}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover rounded-xl border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-md"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => photoInputRefs.current[i]?.click()}
                        className="w-full h-full rounded-xl border-2 border-dashed border-input hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-all text-muted-foreground hover:text-primary"
                      >
                        <Plus className="h-5 w-5" />
                        <span className="text-[10px] font-medium">Photo {i + 1}</span>
                      </button>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={el => { photoInputRefs.current[i] = el }}
                      onChange={(e) => handlePhotoSelect(i, e)}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Max 5MB per photo.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                Back
              </Button>
            )}
            {step < STEPS.length ? (
              <Button
                type="button"
                className="flex-1 rounded-xl gap-1"
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext()}
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1 rounded-xl gap-1"
                onClick={handleSubmit}
                disabled={loading || !canGoNext()}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" />Setting up…</>
                ) : (
                  <>Start Discovering ✦</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
