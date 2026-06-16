/* eslint-disable */
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-11 h-11 shadow-xl border-2 border-primary/30 bg-background/80 backdrop-blur-md hover:bg-background hover:border-primary/60 transition-all duration-300 hover:scale-110"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        title="Toggle theme"
      >
        <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary" />
        <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  )
}
