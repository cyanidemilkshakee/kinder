"use client"

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
  className?: string
}

export function SwitchThumb({ checked, disabled }: SwitchThumbProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all duration-300 ease-in-out ${
        checked
          ? "border-[#34C759] bg-[#34C759]"
          : "border-border bg-muted/60"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <span
        className={`absolute left-[2px] size-6 rounded-full bg-background shadow-[0_3px_8px_rgba(0,0,0,0.15)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none ${
          checked ? "translate-x-[20px]" : "translate-x-0"
        }`}
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
      className={`inline-flex shrink-0 items-center gap-2 rounded-full text-sm font-semibold transition-transform duration-200 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none ${className}`}
    >
      <SwitchThumb checked={checked} disabled={disabled} />
      <span className={checked ? "text-primary" : "text-muted-foreground"}>
        {checked ? checkedLabel : uncheckedLabel}
      </span>
    </button>
  )
}
