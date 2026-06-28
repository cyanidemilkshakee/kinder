"use client"

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type TouchEvent } from "react"
import { ChevronLeft, ChevronRight, Cigarette, Star, Utensils, Wine } from "lucide-react"
import Image from "next/image"
import {
  formatHabit,
} from "@/lib/profile-options"

export type PostProfile = {
  id: string
  username: string
  real_name: string
  department: string
  year: string
  gender: string
  bio: string | null
  relationship_intent: string
  relationship_intents: string[] | null
  avatar_url: string | null
  photos: string[] | null
  interest_tags: string[] | null
  food_preference?: string | null
  drinking_habit?: string | null
  smoking_habit?: string | null
  isSuperLike?: boolean
}

export type ProfileSwipeDirection = "left" | "right" | "up" | "down"

type ProfilePostCardProps = {
  profile: PostProfile
  viewerProfile?: PostProfile | null
  avatarUrl: string
  photos: string[]
  activePhotoIndex: number
  onPrevPhoto: (event: MouseEvent) => void
  onNextPhoto: (event: MouseEvent) => void
  swipeDirection?: ProfileSwipeDirection | null
  onTouchStart?: (event: TouchEvent) => void
  onTouchEnd?: (event: TouchEvent) => void
  onSwipeCommit?: (direction: ProfileSwipeDirection) => void
}

type DragPoint = {
  x: number
  y: number
}

const DRAG_THRESHOLD = 92
const RESIST_AFTER = 130

function resistDrag(value: number) {
  const sign = Math.sign(value)
  const abs = Math.abs(value)
  if (abs <= RESIST_AFTER) return value
  return sign * (RESIST_AFTER + (abs - RESIST_AFTER) * 0.36)
}

export function ProfilePostCard({
  profile,
  viewerProfile,
  avatarUrl,
  photos,
  activePhotoIndex,
  onPrevPhoto,
  onNextPhoto,
  swipeDirection,
  onTouchStart,
  onTouchEnd,
  onSwipeCommit,
}: ProfilePostCardProps) {
  const displayPhotos = photos.length > 0 ? photos : [avatarUrl]
  const activePhoto = displayPhotos[Math.min(activePhotoIndex, displayPhotos.length - 1)]
  const [dragOffset, setDragOffset] = useState<DragPoint>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [photoDirection, setPhotoDirection] = useState<"next" | "prev">("next")
  const pointerStartRef = useRef<DragPoint | null>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const previousPhotoIndexRef = useRef(activePhotoIndex)

  useEffect(() => {
    pointerStartRef.current = null
    activePointerIdRef.current = null

    const frame = window.requestAnimationFrame(() => {
      setDragOffset({ x: 0, y: 0 })
      setDragging(false)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [profile.id])

  useEffect(() => {
    if (activePhotoIndex === previousPhotoIndexRef.current) return
    setPhotoDirection(activePhotoIndex > previousPhotoIndexRef.current ? "next" : "prev")
    previousPhotoIndexRef.current = activePhotoIndex
  }, [activePhotoIndex])

  const swipeClass =
    swipeDirection === "right"
      ? "animate-swipe-right"
      : swipeDirection === "left"
        ? "animate-swipe-left"
        : swipeDirection === "up"
          ? "animate-swipe-up"
          : swipeDirection === "down"
            ? "animate-swipe-down"
            : ""

  const viewerInterests = new Set(
    (viewerProfile?.interest_tags || []).map((interest) => interest.toLowerCase())
  )
  const sharedInterests = (profile.interest_tags || []).filter((interest) =>
    viewerInterests.has(interest.toLowerCase())
  )
  const sharedInterestKeys = new Set(sharedInterests.map((interest) => interest.toLowerCase()))
  const orderedInterests = [...(profile.interest_tags || [])].sort((a, b) =>
    Number(sharedInterestKeys.has(b.toLowerCase())) - Number(sharedInterestKeys.has(a.toLowerCase()))
  )
  const sharedDepartment = Boolean(
    viewerProfile?.department && viewerProfile.department === profile.department
  )
  const sharedYear = Boolean(viewerProfile?.year && viewerProfile.year === profile.year)
  const sharedFoodPreference = Boolean(
    viewerProfile?.food_preference
      && profile.food_preference
      && viewerProfile.food_preference === profile.food_preference
  )
  const sharedDrinkingHabit = Boolean(
    viewerProfile?.drinking_habit
      && profile.drinking_habit
      && viewerProfile.drinking_habit === profile.drinking_habit
  )
  const sharedSmokingHabit = Boolean(
    viewerProfile?.smoking_habit
      && profile.smoking_habit
      && viewerProfile.smoking_habit === profile.smoking_habit
  )

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!onSwipeCommit || swipingPrevented(event.target)) return
    pointerStartRef.current = { x: event.clientX, y: event.clientY }
    activePointerIdRef.current = event.pointerId
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!onSwipeCommit || !pointerStartRef.current || activePointerIdRef.current !== event.pointerId) return
    setDragOffset({
      x: resistDrag(event.clientX - pointerStartRef.current.x),
      y: resistDrag(event.clientY - pointerStartRef.current.y),
    })
  }

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    if (!onSwipeCommit || !pointerStartRef.current || activePointerIdRef.current !== event.pointerId) return

    const deltaX = event.clientX - pointerStartRef.current.x
    const deltaY = event.clientY - pointerStartRef.current.y
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    const direction: ProfileSwipeDirection | null =
      Math.max(absX, absY) < DRAG_THRESHOLD
        ? null
        : absX >= absY
          ? deltaX > 0
            ? "right"
            : "left"
          : deltaY < 0
            ? "up"
            : "down"

    pointerStartRef.current = null
    activePointerIdRef.current = null
    setDragging(false)
    setDragOffset({ x: 0, y: 0 })

    if (direction) onSwipeCommit(direction)
  }

  const dragStyle = {
    transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x / 26}deg) scale(${dragging ? 1.01 : 1})`,
  } as CSSProperties

  return (
    <article
      className={`mx-auto grid w-full max-w-4xl touch-none grid-cols-[minmax(0,0.98fr)_minmax(145px,0.78fr)] overflow-hidden rounded-lg border bg-background shadow-xl duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform sm:grid-cols-[minmax(0,0.92fr)_minmax(220px,0.78fr)] xl:max-w-5xl ${dragging ? "cursor-grabbing shadow-2xl transition-[box-shadow]" : "transition-[box-shadow,transform]"} ${onSwipeCommit ? "cursor-grab" : ""} ${swipeClass}`}
      style={swipeDirection ? undefined : dragStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={onSwipeCommit ? undefined : onTouchStart}
      onTouchEnd={onSwipeCommit ? undefined : onTouchEnd}
    >
      <div className="relative aspect-[4/5] min-h-0 bg-muted">
        <Image
          key={`${profile.id}-${activePhotoIndex}-${activePhoto}`}
          src={activePhoto}
          alt={profile.real_name}
          fill
          className={`object-cover ${photoDirection === "next" ? "animate-photo-slide-next" : "animate-photo-slide-prev"}`}
          sizes="(max-width: 640px) 100vw, 50vw"
        />

        {displayPhotos.length > 1 && (
          <div className="absolute left-1/2 top-2.5 flex w-1/2 -translate-x-1/2 gap-1.5">
            {displayPhotos.map((_, index) => (
              <span key={index} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/35">
                <span
                  className={`block h-full rounded-full bg-white transition-all duration-500 ease-out ${
                    index <= activePhotoIndex ? "w-full" : "w-0"
                  }`}
                />
              </span>
            ))}
          </div>
        )}

        {displayPhotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={onPrevPhoto}
              disabled={activePhotoIndex === 0}
              className="absolute left-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition hover:bg-background disabled:opacity-40"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onNextPhoto}
              disabled={activePhotoIndex >= displayPhotos.length - 1}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition hover:bg-background disabled:opacity-40"
              aria-label="Next photo"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="flex items-center gap-3 border-b px-3 py-3 sm:px-5 sm:py-4">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-full sm:size-12">
            <Image
              src={avatarUrl}
              alt={`${profile.username} avatar`}
              fill
              className="bg-muted object-cover"
              sizes="48px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold leading-tight sm:text-base">{profile.real_name}</h2>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">@{profile.username}</p>
          </div>
          {profile.isSuperLike && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Star className="h-3.5 w-3.5" />
              Super
            </span>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-start gap-4 px-3 py-5 sm:px-5 sm:py-6">
          <div>
            <p className="text-[15px] font-bold uppercase tracking-wide text-muted-foreground">About</p>
            <p className="mt-2 line-clamp-3 text-[13px] font-normal leading-relaxed text-foreground">
              {profile.bio || "No bio yet."}
            </p>
          </div>

          <div>
            <p className="text-[15px] font-bold uppercase tracking-wide text-muted-foreground">Academics</p>
            <p className="mt-2 text-[13px] font-normal leading-relaxed text-foreground">
              <span className={sharedDepartment ? "font-semibold text-primary" : undefined}>
                {profile.department}
              </span>
              {" / "}
              <span className={sharedYear ? "font-semibold text-primary" : undefined}>
                {profile.year} Year
              </span>
            </p>
          </div>

          <div>
            <p className="text-[15px] font-bold uppercase tracking-wide text-muted-foreground">Food & habits</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-normal leading-relaxed text-foreground">
              <span className={`inline-flex items-center gap-1.5 ${sharedFoodPreference ? "font-semibold text-primary" : ""}`}>
                <Utensils className={`size-4 ${sharedFoodPreference ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                Food: {formatHabit(profile.food_preference)}
              </span>
              <span className={`inline-flex items-center gap-1.5 ${sharedDrinkingHabit ? "font-semibold text-primary" : ""}`} title="Drinking">
                <Wine className={`size-4 ${sharedDrinkingHabit ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                <span className="sr-only">Drinking:</span>
                {formatHabit(profile.drinking_habit)}
              </span>
              <span className={`inline-flex items-center gap-1.5 ${sharedSmokingHabit ? "font-semibold text-primary" : ""}`} title="Smoking">
                <Cigarette className={`size-4 ${sharedSmokingHabit ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                <span className="sr-only">Smoking:</span>
                {formatHabit(profile.smoking_habit)}
              </span>
            </div>
          </div>

          {orderedInterests.length > 0 && (
            <div>
              <p className="text-[15px] font-bold uppercase tracking-wide text-muted-foreground">Interests</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {orderedInterests.slice(0, 8).map((tag) => (
                  <span
                    key={tag}
                    className={`text-[13px] leading-relaxed ${
                      sharedInterestKeys.has(tag.toLowerCase())
                        ? "font-semibold text-primary"
                        : "font-normal text-foreground"
                    }`}
                  >
                    {tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function swipingPrevented(target: EventTarget) {
  return target instanceof HTMLElement && Boolean(target.closest("button, input, textarea, select, a"))
}
