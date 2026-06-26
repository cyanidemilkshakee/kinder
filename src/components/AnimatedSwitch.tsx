"use client"

import { useState } from "react"

type SwitchThumbProps = {
  checked: boolean
  disabled?: boolean
}

type AnimatedSwitchProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  ariaLabel: string
  checkedLabel?: string
  uncheckedLabel?: string
  showLabel?: boolean
  className?: string
}

// iOS 26 "Liquid Glass" spring physics constants
// Thumb squishes to a pill while sliding, springs back to a circle on land
export function SwitchThumb({ checked, disabled }: SwitchThumbProps) {
  const [pressing, setPressing] = useState(false)

  return (
    <span
      aria-hidden="true"
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => setPressing(false)}
      onPointerLeave={() => setPressing(false)}
      style={{
        // Track color + scale feedback on press
        backgroundColor: checked ? "#34C759" : undefined,
        borderColor: checked ? "#34C759" : undefined,
        transform: pressing ? "scale(0.94)" : "scale(1)",
        transition: pressing
          ? "transform 0.08s cubic-bezier(0.4,0,0.6,1)"
          : "background-color 0.28s cubic-bezier(0.4,0,0.2,1), border-color 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.45s cubic-bezier(0.34,1.56,0.64,1)",
      }}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border select-none ${
        checked ? "" : "bg-muted/60 border-border"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <span
        style={{
          // iOS 26 signature: thumb morphs into a wide pill while sliding
          width: pressing ? "28px" : "24px",
          height: "24px",
          // Offset shifts left when pressing-while-on, right when pressing-while-off
          // so the squish feels directional
          transform: checked
            ? pressing
              ? "translateX(14px)"
              : "translateX(20px)"
            : pressing
              ? "translateX(2px)"
              : "translateX(2px)",
          transition: pressing
            ? // While pressed: thumb stretches quickly
              "width 0.12s cubic-bezier(0.4,0,0.6,1), transform 0.12s cubic-bezier(0.4,0,0.6,1)"
            : // On release: spring back to circle and glide to destination
              "width 0.45s cubic-bezier(0.34,1.56,0.64,1), transform 0.42s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        className="absolute rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.22),0_0.5px_1px_rgba(0,0,0,0.14)] motion-reduce:transition-none"
      />
    </span>
  )
}

export function AnimatedSwitch({
  checked,
  onCheckedChange,
  disabled,
  ariaLabel,
  checkedLabel = "On",
  uncheckedLabel = "Off",
  showLabel = true,
  className = "",
}: AnimatedSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`inline-flex shrink-0 items-center ${showLabel ? "gap-2" : ""} rounded-full text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none ${className}`}
    >
      <SwitchThumb checked={checked} disabled={disabled} />
      {showLabel && (
        <span
          style={{
            transition: "color 0.25s cubic-bezier(0.4,0,0.2,1)",
            color: checked ? "#34C759" : undefined,
          }}
          className={checked ? "" : "text-muted-foreground"}
        >
          {checked ? checkedLabel : uncheckedLabel}
        </span>
      )}
    </button>
  )
}
