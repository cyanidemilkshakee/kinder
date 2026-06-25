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
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 ${
        checked
          ? "border-primary bg-primary"
          : "border-border bg-muted/60"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <span
        className={`absolute left-1 size-5 rounded-full bg-background shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none ${
          checked ? "translate-x-5" : "translate-x-0"
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
