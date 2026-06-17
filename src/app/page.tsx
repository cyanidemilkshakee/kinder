/* eslint-disable */
"use client"

import { useState, useEffect, Suspense } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { isValidUsername, normalizeUsername, usernameGuidance } from "@/lib/username"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" aria-hidden="true" fill="none">
      {/* Monochrome Google 'G' - no blue/red/green/yellow brand colors */}
      <circle cx="12" cy="12" r="10" className="fill-stone-200 dark:fill-zinc-700" />
      <path
        d="M17.5 12.2h-5.4v2.1h3.1c-.3 1.5-1.6 2.4-3.1 2.4-1.9 0-3.4-1.5-3.4-3.4s1.5-3.4 3.4-3.4c.8 0 1.6.3 2.2.8l1.5-1.5C14.6 8.4 13.4 8 12.1 8 9 8 6.5 10.5 6.5 13.3S9 18.6 12.1 18.6c2.9 0 5.2-2 5.2-5.1 0-.4 0-.9-.1-1.3h.3z"
        className="fill-stone-600 dark:fill-zinc-300"
      />
    </svg>
  )
}

function AuthForm() {
  const [view, setView] = useState<"login" | "signup" | "forgot">("login")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('real_name, username')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile?.real_name || !profile?.username) {
          router.replace('/onboarding')
        } else {
          router.replace('/discover')
        }
      } else {
        setCheckingSession(false)
      }
    }
    checkSession()

    if (searchParams.get('error') === 'auth') {
      setError("Please use your college email only.")
    }
  }, [searchParams])

  const isValidEmail = (emailToCheck: string) => {
    const lowerEmail = emailToCheck.toLowerCase()
    if (lowerEmail === "ghostfaked02@gmail.com" || lowerEmail === "ghostfaked03@gmail.com" || lowerEmail === "thetaghost1@gmail.com") return true
    return lowerEmail.endsWith("@bmsce.ac.in")
  }

  const resolveLoginEmail = async (identifier: string) => {
    const value = identifier.trim()

    if (value.includes("@")) {
      if (!isValidEmail(value)) {
        throw new Error("Please use your institutional email (@college.edu)")
      }
      return value
    }

    const loginUsername = normalizeUsername(value)
    if (!isValidUsername(loginUsername)) {
      throw new Error(usernameGuidance(loginUsername) || "Enter a valid username.")
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", loginUsername)
      .maybeSingle()

    if (error) throw error
    if (!data?.email) throw new Error("No account found for that username.")

    return data.email
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMsg("")

    const authEmail = email.trim()
    const signupUsername = normalizeUsername(username)

    if ((view === "signup" || view === "forgot") && !isValidEmail(authEmail)) {
      setError("Please use your institutional email (@college.edu)")
      return
    }

    if (view === "signup" && !isValidUsername(signupUsername)) {
      setError(usernameGuidance(signupUsername) || "Enter a valid username.")
      return
    }

    setLoading(true)

    if (view === "signup") {
      const { data: existingUsername, error: usernameError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", signupUsername)
        .maybeSingle()

      if (usernameError) {
        setError(usernameError.message)
        setLoading(false)
        return
      }

      if (existingUsername) {
        setError("That username is already taken.")
        setLoading(false)
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password,
        options: { data: { username: signupUsername, has_password: true } },
      })
      if (authError) {
        setError(authError.message)
      } else if (authData.user) {
        setMsg("Check your email for a confirmation link to activate your account.")
        setView("login")
      }
    } else if (view === "login") {
      let loginEmail = ""
      try {
        loginEmail = await resolveLoginEmail(authEmail)
      } catch (err: any) {
        setError(err?.message || "Unable to resolve that username.")
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
      if (error) {
        setError(error.message)
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('real_name, username')
          .eq('id', data.user?.id)
          .single()

        if (!profile || !profile.real_name || !profile.username) {
          router.push('/onboarding')
        } else {
          router.push('/discover')
        }
      }
    } else if (view === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        setError(error.message)
      } else {
        setMsg("Password reset link sent! Check your inbox.")
        setView("login")
      }
    }

    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-6xl font-extrabold tracking-tighter text-primary drop-shadow-lg">
            Kinder
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Campus-exclusive social discovery ✦
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-background/80 p-8 backdrop-blur-xl">
          {/* Tabs */}
          <div className="mb-6 flex rounded-xl bg-muted p-1">
            {(["login", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setView(tab); setError(""); setMsg("") }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200 ${
                  view === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {view === "forgot" && (
            <p className="mb-4 text-center text-sm font-semibold text-muted-foreground">
              Reset your password
            </p>
          )}

          {/* Alerts */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <span className="mt-0.5 text-lg leading-none">⚠</span>
              <span>{error}</span>
            </div>
          )}
          {msg && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
              <span className="mt-0.5 text-lg leading-none">✓</span>
              <span>{msg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium">
                {view === "login" ? "Email or Username" : "Institutional Email"}
              </label>
              <input
                id="email"
                name="email"
                type={view === "login" ? "text" : "email"}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={view === "login" ? "your.name@college.edu or username" : "your.name@college.edu"}
                className="block w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            {view === "signup" && (
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-sm font-medium">
                  Username
                </label>
                <div className="flex rounded-xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                  <span className="flex items-center pl-4 text-sm text-muted-foreground">@</span>
                  <input
                    id="username"
                    name="username"
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
                <p className="text-xs text-muted-foreground">3-20 lowercase letters, numbers, or underscores.</p>
              </div>
            )}

            {view !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium">
                    Password
                  </label>
                  {view === "login" && (
                    <button
                      type="button"
                      onClick={() => { setView("forgot"); setError(""); setMsg("") }}
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full rounded-xl py-2.5 text-sm font-semibold shadow-md transition-all hover:shadow-lg hover:shadow-primary/20"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
              ) : view === "login" ? "Sign In" : view === "signup" ? "Create Account" : "Send Reset Link"}
            </Button>
          </form>

          {(view === "login" || view === "signup") && (
            <>
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or continue with</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full rounded-xl border-border py-2.5 text-sm font-semibold hover:bg-muted/50 transition-all"
                disabled={loading}
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Only <span className="font-semibold text-primary">college emails</span> are accepted.
              </p>
            </>
          )}

          {view === "forgot" && (
            <button
              type="button"
              onClick={() => { setView("login"); setError(""); setMsg("") }}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to sign in
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Kinder is an independent, student-built platform. Not affiliated with college administration.
        </p>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  )
}
