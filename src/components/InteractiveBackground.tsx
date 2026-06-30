 
"use client"

import React from "react"

type Variant = "auth" | "home" | "chat" | "likes" | "profile" | "confessions" | "default"

// Per-variant accent colours (zinc/stone/violet/gold palette - no blues)
const VARIANT_STYLES: Record<Variant, { orb1: string; orb2: string; orb3: string }> = {
  auth:        { orb1: "bg-violet-500/15",  orb2: "bg-stone-400/10",    orb3: "bg-violet-700/10"  },
  home:        { orb1: "bg-amber-400/15",   orb2: "bg-violet-500/10",   orb3: "bg-stone-400/10"   },
  chat:        { orb1: "bg-zinc-400/15",    orb2: "bg-violet-400/10",   orb3: "bg-stone-300/10"   },
  likes:       { orb1: "bg-rose-400/15",    orb2: "bg-stone-400/10",    orb3: "bg-violet-400/10"  },
  profile:     { orb1: "bg-violet-500/15",  orb2: "bg-zinc-400/10",     orb3: "bg-stone-400/10"   },
  confessions: { orb1: "bg-violet-600/15",  orb2: "bg-zinc-500/10",     orb3: "bg-stone-500/8"    },
  default:     { orb1: "bg-zinc-500/10",    orb2: "bg-stone-400/10",    orb3: "bg-violet-400/8"   },
}

export function InteractiveBackground({ variant = "default" }: { variant?: Variant }) {
  const { orb1, orb2, orb3 } = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-background" aria-hidden="true">
      {/* ── Subtle dot-grid mesh ── */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.055]"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  )
}
