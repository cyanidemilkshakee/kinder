 
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <button
      type="button"
      className="group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-black/80 transition-all duration-200 hover:bg-black/10 hover:text-black"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <span className="relative mr-3 flex size-[18px] flex-shrink-0 items-center justify-center" aria-hidden="true">
        <Sun className="absolute size-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </span>
      <span className="tracking-wide">Theme</span>
      <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-black/50">
        <span className="dark:hidden">Light</span>
        <span className="hidden dark:inline">Dark</span>
      </span>
    </button>
  )
}
