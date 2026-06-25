"use client"

import { useEffect, useState, type MouseEvent, type ReactNode } from "react"

type MotionModalProps = {
  open: boolean
  children: ReactNode
  className?: string
  panelClassName?: string
  placement?: "center" | "bottom"
  labelledBy?: string
  onOverlayMouseDown?: (event: MouseEvent<HTMLDivElement>) => void
}

const EXIT_MS = 180

export function MotionModal({
  open,
  children,
  className = "",
  panelClassName = "",
  placement = "center",
  labelledBy,
  onOverlayMouseDown,
}: MotionModalProps) {
  const [present, setPresent] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    let frame = 0
    let timeout = 0

    if (open) {
      frame = window.requestAnimationFrame(() => {
        setPresent(true)
        setClosing(false)
      })
      return () => window.cancelAnimationFrame(frame)
    }

    if (!present) return

    frame = window.requestAnimationFrame(() => {
      setClosing(true)
      timeout = window.setTimeout(() => {
        setPresent(false)
        setClosing(false)
      }, EXIT_MS)
    })

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [open, present])

  if (!present) return null

  const placementClass =
    placement === "bottom"
      ? "items-end sm:items-center"
      : "items-center"

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center p-4 backdrop-blur-sm ${
        closing ? "animate-modal-overlay-out" : "animate-modal-overlay-in"
      } ${placementClass} ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onMouseDown={onOverlayMouseDown}
    >
      <div
        className={`${closing ? "animate-modal-out" : "animate-modal-in"} ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  )
}
