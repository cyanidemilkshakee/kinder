/* eslint-disable */
"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

type LandingTopBarProps = {
  isSignedIn?: boolean
}

export function LandingTopBar({ isSignedIn = false }: LandingTopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/30 bg-background/70 backdrop-blur-lg">
      <div className="flex w-full items-center justify-between px-4 py-4 sm:px-8 lg:px-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold tracking-tighter text-primary drop-shadow">Kinder</span>
          <span className="hidden rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary sm:inline">
            Beta
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            How it Works
          </Link>
          <Link href="/#safety" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Safety
          </Link>
          <Link href="/#testimonials" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Reviews
          </Link>
          <Link href="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link
              href="/discover"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:shadow-primary/30 hover:brightness-105"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-xl border border-border/60 bg-background/80 px-4 py-2 text-sm font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:shadow-primary/30 hover:brightness-105"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border/30 bg-muted/20 px-4 py-10 sm:px-8 lg:px-16">
      <div className="w-full">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <div className="text-xl font-extrabold tracking-tighter text-primary">Kinder</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Campus-exclusive social discovery. Made for students, by students.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/#features" className="transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="/#how-it-works" className="transition-colors hover:text-foreground">
              How it Works
            </Link>
            <Link href="/#safety" className="transition-colors hover:text-foreground">
              Safety
            </Link>
            <Link href="/about" className="transition-colors hover:text-foreground">
              About
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/auth/login" className="transition-colors hover:text-foreground">
              Sign In
            </Link>
            <Link href="/auth/signup" className="transition-colors hover:text-foreground">
              Sign Up
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t border-border/30 pt-6 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Kinder. An independent, student-built platform. Not affiliated with any college administration.
        </div>
      </div>
    </footer>
  )
}

export function LandingThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const dark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background/80 shadow-xl backdrop-blur-md transition-all hover:scale-110 hover:border-primary/50 hover:shadow-primary/30"
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <Sun className="absolute h-5 w-5 rotate-0 scale-100 text-black transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 text-white transition-all dark:rotate-0 dark:scale-100" />
      </span>
    </button>
  )
}
