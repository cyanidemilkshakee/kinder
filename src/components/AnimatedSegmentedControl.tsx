"use client"

import type { ReactNode } from "react"

type SegmentedOption<T extends string> = {
  value: T
  label: ReactNode
  count?: number
}

type AnimatedSegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  ariaLabel: string
}

export function AnimatedSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
  ariaLabel,
}: AnimatedSegmentedControlProps<T>) {
  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value))

  return (
    <div
      className={`relative grid rounded-lg border bg-background/95 p-1 backdrop-blur ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label={ariaLabel}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-1 top-1 rounded-md bg-primary shadow-sm transition-[transform,width] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none"
        style={{
          left: "0.25rem",
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`relative z-10 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-200 motion-reduce:transition-none ${
              active
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors duration-200 ${
                  active
                    ? "bg-black/10 text-primary-foreground"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
