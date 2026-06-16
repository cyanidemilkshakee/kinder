/* eslint-disable */
"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, User, BookOpen, Sparkles, ChevronRight, Image as ImageIcon, Tags, Upload } from "lucide-react"

const STEPS = [
  { id: 1, title: "Who are you?", icon: User, desc: "Tell us your name and identity" },
  { id: 2, title: "Your Photo", icon: ImageIcon, desc: "Upload a real profile picture" },
  { id: 3, title: "Your studies", icon: BookOpen, desc: "Department and year of study" },
  { id: 4, title: "What you seek", icon: Sparkles, desc: "Your intent on Kinder" },
  { id: 5, title: "Your interests", icon: Tags, desc: "Tags to help others find you" },
]

const DEPARTMENTS = [
  "CSE", "ISE", "ECE", "EEE", "ME", "Civil", "Chemical", "Bio-Technology",
  "AI & ML", "AI & DS", "Cyber Security", "MCA", "MBA", "Other"
]

const AVAILABLE_TAGS = [
  "Anime", "Gym", "Music", "Reading", "Gaming", "Photography", "Travel", "Art",
  "Coding", "Movies", "Sports", "Dance", "Foodie", "Tech", "Fashion", "Night Owl"
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  
  // Step 1
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
  const [relationshipIntent, setRelationshipIntent] = useState("friendship")
  
  // Step 5
  const [interestTags, setInterestTags] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const supabase = createClient()

  const canGoNext = () => {
    if (step === 1) return realName.trim().length >= 2 && gender !== "" && dob !== ""
    if (step === 2) return avatarFile !== null
    if (step === 3) return department !== "" && year !== ""
    if (step === 4) return relationshipIntent !== ""
    if (step === 5) return interestTags.length >= 3
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

  const toggleTag = (tag: string) => {
    if (interestTags.includes(tag)) {
      setInterestTags(interestTags.filter(t => t !== tag))
    } else {
      if (interestTags.length >= 5) {
        setError("You can select a maximum of 5 tags")
        return
      }
      setError("")
      setInterestTags([...interestTags, tag])
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

    let avatarUrl = ""

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile)

      if (uploadError) {
        setError("Failed to upload avatar: " + uploadError.message)
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
        
      avatarUrl = publicUrl
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        real_name: realName,
        department,
        year,
        gender,
        bio,
        date_of_birth: dob,
        avatar_url: avatarUrl,
        relationship_intent: relationshipIntent,
        interest_tags: interestTags,
        hookup_opt_in: false,
      })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
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
        <div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-2xl backdrop-blur-xl">
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

          {/* Step 4: Intent */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                This helps us match you with compatible people. You can change this anytime.
              </p>
              {[
                { value: "friendship", label: "Friendship & Networking", emoji: "🤝", desc: "Looking to expand your social circle on campus" },
                { value: "dating", label: "Dating", emoji: "💛", desc: "Open to romantic connections with like-minded people" },
              ].map((intent) => (
                <button
                  key={intent.value}
                  type="button"
                  onClick={() => setRelationshipIntent(intent.value)}
                  className={`w-full flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                    relationshipIntent === intent.value
                      ? "border-primary bg-primary/10"
                      : "border-input bg-background hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl mt-0.5">{intent.emoji}</span>
                  <div>
                    <div className="font-semibold text-sm">{intent.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{intent.desc}</div>
                  </div>
                  <div className={`ml-auto mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 transition-all ${
                    relationshipIntent === intent.value ? "border-primary bg-primary" : "border-muted-foreground"
                  }`} />
                </button>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                💡 Hookup visibility is a separate opt-in available in Settings after you join.
              </p>
            </div>
          )}

          {/* Step 5: Interests */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">Select 3 to 5 tags.</p>
                <span className="text-xs font-semibold text-primary">{interestTags.length}/5</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
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
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Setting up…</>
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
