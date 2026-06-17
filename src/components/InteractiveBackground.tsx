 
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

      {/* ── Noise grain overlay ── */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.03] dark:opacity-[0.045] pointer-events-none">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      {/* ── Floating orbs ── */}
      <div
        className={`absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full ${orb1} blur-[100px] animate-[orbFloat_18s_ease-in-out_infinite]`}
      />
      <div
        className={`absolute -bottom-48 -right-24 h-[600px] w-[600px] rounded-full ${orb2} blur-[120px] animate-[orbFloat_22s_ease-in-out_infinite_reverse]`}
        style={{ animationDelay: "-6s" }}
      />
      <div
        className={`absolute top-1/2 left-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full ${orb3} blur-[90px] animate-[orbFloat_26s_ease-in-out_infinite]`}
        style={{ animationDelay: "-12s" }}
      />
      {/* Soft top-centre highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[200px] w-[700px] rounded-full bg-primary/6 dark:bg-primary/8 blur-[80px]" />

      {/* ── Keyframes injected inline (avoids globals.css pollution) ── */}
      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -40px) scale(1.06); }
          66%       { transform: translate(-20px, 20px) scale(0.96); }
        }
      `}</style>
    </div>
  )
}
