"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { SwitchThumb } from "@/components/AnimatedSwitch"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const dark = (resolvedTheme || theme) === "dark"

  return (
    <button
      type="button"
      className="group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-extrabold text-black/80 transition-all duration-200 hover:bg-black/10 hover:text-black"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Toggle theme"
      title="Toggle theme"
      role="switch"
      aria-checked={dark}
    >
      <span className="relative mr-3 flex size-[18px] flex-shrink-0 items-center justify-center" aria-hidden="true">
        <Sun className="absolute size-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </span>
      <span className="tracking-wide">Theme</span>
      <span className="ml-auto flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-black/50">
          <span className="dark:hidden">Light</span>
          <span className="hidden dark:inline">Dark</span>
        </span>
        <SwitchThumb checked={dark} />
      </span>
    </button>
  )
}
